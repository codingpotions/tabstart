
<script>
  import { onMount } from "svelte";

  let sites = [];

  function parseSites(sitesList) {
    sites = sitesList.map(site => {
      const regex = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g;
      const domain = regex.exec(site.url)[1];
      return {...site, domain };
    });
    sites = sites.filter(site => !site.domain.includes("localhost"));
  }

  onMount(async () => {
    const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    if (isFirefox) {
      browser.topSites.get().then(mostVisitedURL => {
        parseSites(mostVisitedURL);
      });
    } else {
      chrome.topSites.get(mostVisitedURL => {
        parseSites(mostVisitedURL);
      });
    }
  });

</script>

{#if sites.length }
  <div class="sites">
    {#each sites as site}
      <a href="{site.url}">
        <img src="https://logo.clearbit.com/{site.domain}?s=128" alt="{site.title}">
      </a>
    {/each}
  </div>
{/if}

<style>
  .sites {
    display: grid;
    grid-gap: 2rem;
    grid-template-columns: repeat(auto-fit, minmax(64px, 128px));
    justify-content: center;
  }
  .sites > a,
  .sites > a > img {
    width: 100%;
  }
</style>
