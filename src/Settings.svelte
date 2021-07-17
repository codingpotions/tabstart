<script>
  import Slider from "./Slider.svelte";
  import { settings } from './store/settings.js';
  import { onDestroy } from "svelte";

  let settingsValue = {};

  const unsubscribe = settings.subscribe(async settingsStore => {
    const newValue = await settingsStore;
    settingsValue = newValue;
  });
  
  onDestroy(unsubscribe);

  function storeValue(e, key) {
    const newValue = parseInt(e.detail.value);
    settings.update(n => ({...n, [key]: newValue}));
  }

</script>

<div class="settings">
  <div class="container">
    <h2 class="title">Settings</h2>
    <div class="columns">
      <div class="left">
        <Slider class="form-control" label="Clock size" value="{settingsValue.clockSize}" on:updated={e => storeValue(e, "clockSize")} min="{1}" />
        <Slider class="form-control" label="Number of sites" value="{settingsValue.sitesCount}" on:updated={e => storeValue(e, "sitesCount")} min="{1}" />
        <Slider class="form-control" label="Sites icon size" value="{settingsValue.sitesIconSize}" on:updated={e => storeValue(e, "sitesIconSize")} min="{24}" max={256} />
      </div>
      <div class="right">
      </div>
    </div>
  </div>
</div>

<style>
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
    max-width: 1400px;
    margin: 0 auto;
  }
  .title {
    font-size: 3rem;
  }
  .left > :global(* + *) {
    margin-top: 3rem;
  }
</style>
