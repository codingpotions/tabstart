import { writable } from "svelte/store";
import { asyncable } from "svelte-asyncable";

export const settings = asyncable(
  async () => {
    let storedSettings = JSON.parse(localStorage.getItem("settings"));
    if (!storedSettings) {
      let savedSettings = await loadMostUsedSites();
      storedSettings = savedSettings;
    }
    return storedSettings;
  },
  (val) => saveSettings(val)
);

async function loadMostUsedSites() {
  return new Promise(async (resolve, reject) => {
    let sites = null;
    if (typeof browser === "undefined") {
      const savedSettings = saveSettings({ sites: new Array(10).fill({ url: "", icon: "" }) });
      return Promise.resolve(savedSettings);
    }
    const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    if (isFirefox) {
      const mostVisitedURL = await browser.topSites.get();
      sites = parseSites(mostVisitedURL);
    } else if (chrome) {
      chrome.topSites.get((mostVisitedURL) => {
        sites = parseSites(mostVisitedURL);
      });
    }
    const savedSettings = saveSettings({ sites });
    resolve(savedSettings);
  });
}

export function parseSites(sitesList) {
  return sitesList
    .map((site) => {
      const regex = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g;
      const domain = regex.exec(site.url)[1];
      let icon = site.icon;
      if (!icon) {
        icon = `https://logo.clearbit.com/${domain}?s=256`;
      }
      return { ...site, domain, icon };
    })
    .filter((site) => !site.domain.includes("localhost"));
}

function saveSettings(settingsToSave) {
  settingsToSave = defaultSettings(settingsToSave);
  localStorage.setItem("settings", JSON.stringify(settingsToSave));
  return settingsToSave;
}

function defaultSettings(oldSettings = {}) {
  oldSettings = setDefaultValue(oldSettings, "clockSize", 6);
  oldSettings = setDefaultValue(oldSettings, "sitesIconSize", 128);
  oldSettings = setDefaultValue(oldSettings, "sitesCount", 6);
  oldSettings = setDefaultValue(oldSettings, "sites", []);
  return oldSettings;
}

function setDefaultValue(originalObject, key, defaultValue) {
  let newObject = originalObject || {};
  if (!newObject[key]) {
    newObject[key] = defaultValue;
  }
  return newObject;
}
