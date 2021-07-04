
<script>
  import { onMount } from "svelte";

  let sites = [];

  onMount(async () => {
    browser.topSites.get().then(mostVisitedURL => {
      sites = mostVisitedURL.map(site => {
        const regex = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/g;
        const domain = regex.exec(site.url)[1];
        return {...site, domain }
      })
      sites = sites.filter(site => !site.domain.includes("localhost"));
    });
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
