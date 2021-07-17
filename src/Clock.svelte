<script>
  import { settings } from './store/settings.js';
  import { getTopWallpaper } from "./services/reddit.js";
  import { onMount, onDestroy } from "svelte";

  let h = "00";
  let m = "00";
  let s = "00";

  let settingsValue = { sites: [] };

  settings.subscribe(async value => settingsValue = await value);

  const unsubscribe = settings.subscribe(async settingsStore => {
    const newValue = await settingsStore;
    settingsValue = newValue;
  });
  
  onDestroy(unsubscribe);

  $: clockSize = settingsValue.clockSize;

  function startClock() {
    const now = new Date();
    h = addZero(now.getHours());
    m = addZero(now.getMinutes());
    s = addZero(now.getSeconds());
  }

  function addZero(number) {
    if (number < 10) {
      return "0" + number;
    }
    return number.toString();
  }

  onMount(async () => {
    startClock();
    setInterval(() => startClock(), 1 * 1000);
  });

</script>

<h2 class="clock" style="font-size: {clockSize}rem">{h}:{m}:{s}</h2>

<style>
  .clock {
    color: white;
    margin: 0;
  }
</style>
