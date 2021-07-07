import { writable } from "svelte/store";


let storedSettings = localStorage.getItem("settings");
if (!storedSettings) {
  storedSettings = saveToLocalHost();
}

export const settings = writable(JSON.parse(storedSettings));

settings.subscribe(value => {
  saveToLocalHost(value);
});


function saveToLocalHost(settingsToSave) {
  settingsToSave = defaultSettings(settingsToSave);
  localStorage.setItem("settings", JSON.stringify(settingsToSave));
  return settingsToSave;
}

function defaultSettings(oldSettings = {}) {
  oldSettings = setDefaultValue(oldSettings, "sitesCount", 6);
  return oldSettings;
}

function setDefaultValue(originalObject, key, defaultValue) {
  let newObject = originalObject || {};
  if (!newObject[key]) {
    newObject[key] = defaultValue;
  }
  return newObject;
}
