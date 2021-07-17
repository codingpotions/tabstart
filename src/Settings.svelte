<script>
  import Slider from "./Slider.svelte";
  import { settings, parseSites } from './store/settings.js';
  import { onDestroy } from "svelte";

  let settingsValue = {};

  const unsubscribe = settings.subscribe(async settingsStore => {
    const newValue = await settingsStore;
    settingsValue = newValue;
  });
  
  onDestroy(unsubscribe);

  $: sites = settingsValue.sites;

  function storeNumericValue(e, key) {
    const newValue = parseInt(e.detail.value);
    settings.update(n => ({...n, [key]: newValue}));
  }

  function storeSite(e, index) {
    const newURL = e.srcElement.value;
    sites[index] = { ...sites[index], url: newURL }
    sites = parseSites(sites);
    settings.update(n => ({...n, sites}));
  }
</script>

<div class="settings">
  <div class="container">
    <h2 class="title">Settings</h2>
    <div class="columns">
      <div class="left">
        <Slider class="form-control" label="Clock size" value="{settingsValue.clockSize}" on:updated={e => storeNumericValue(e, "clockSize")} min="{1}" />
        <Slider class="form-control" label="Number of sites" value="{settingsValue.sitesCount}" on:updated={e => storeNumericValue(e, "sitesCount")} min="{1}" />
        <Slider class="form-control" label="Sites icon size" value="{settingsValue.sitesIconSize}" on:updated={e => storeNumericValue(e, "sitesIconSize")} min="{24}" max={256} />
        <div class="form-control">
          <div class="form-title">Current sites</div>
          {#each Array(10) as _, i}
            {#if sites && sites[i] }
              <input type="text" value="{settingsValue.sites[i].url}" on:input={ e => storeSite(e, i)}>
            {/if }
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .form-control + .form-control {
    margin-top: 3rem;
  }
  .form-title {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  input {
    display: block;
    width: 100%;
  }
  .settings {
    position: fixed;
    top: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.5);
    width: 100%;
    height: 100%;
    z-index: 1;
    color: white;
    padding: 3rem 1rem;
  }
  .container {
    max-width: 500px;
    margin: 0 auto;
  }
  .title {
    font-size: 3rem;
  }
  .left > :global(* + *) {
    margin-top: 3rem;
  }
</style>
