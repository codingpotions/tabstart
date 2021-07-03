<script>
  import { getTopWallpaper } from "./services/reddit.js";
  import { onMount } from "svelte";

  let h = "00";
  let m = "00";
  let s = "00";

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

<h2 class="clock">{h}:{m}:{s}</h2>

<style>
  .clock {
    color: white;
    margin: 0;
    font-size: 6rem;
  }
</style>
