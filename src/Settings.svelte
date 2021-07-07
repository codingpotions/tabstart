<script>
  import Slider from "./Slider.svelte";
  import { settings } from './store/settings.js';
  import { onDestroy } from "svelte";

  let settingsValue = 0;
  const unsubscribe = settings.subscribe(value => settingsValue = value)
  onDestroy(unsubscribe)

  function storeSitesCount(e) {
    const newValue = parseInt(e.detail.value);
    settings.update(n => ({...n, sitesCount: newValue}));
  }

</script>

<div class="settings">
  <div class="container">
    <h2 class="title">Settings</h2>
    <div class="columns">
      <div class="left">
        <Slider label="Number of sites" value="{settingsValue.sitesCount}" on:updated={storeSitesCount} />
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
</style>
