
<script>
  import { settings } from './store/settings.js';
  import { onDestroy } from "svelte";

  let settingsValue = { sites: [] };

  settings.subscribe(async value => settingsValue = await value);

  const unsubscribe = settings.subscribe(async settingsStore => {
    const newValue = await settingsStore;
    settingsValue = newValue;
  });
  
  onDestroy(unsubscribe);

  $: sites = settingsValue.sites.slice(0, settingsValue.sitesCount);
  $: sitesIconSize = settingsValue.sitesIconSize;

</script>

{#if sites.length }
  <div class="sites" style="grid-template-columns: repeat(auto-fit, minmax(24px, {settingsValue.sitesIconSize}px));">
    {#each sites as site}
      <a href="{site.url}">
        <img src="https://logo.clearbit.com/{site.domain}?s=256" alt="{site.title}">
      </a>
    {/each}
  </div>
{/if}

<style>
  .sites {
    display: grid;
    grid-gap: 2rem;
    
    justify-content: center;
  }
  .sites > a,
  .sites > a > img {
    width: 100%;
  }
</style>
