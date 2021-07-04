<script>
  import { getTopWallpaper } from "./services/reddit.js";
  import { onMount } from "svelte";
  import Clock from "./Clock.svelte";
  import Sites from "./Sites.svelte";

  let bg = null;

  onMount(async () => {
    const bgResponse = await getTopWallpaper();
    bg = bgResponse.data.children[0].data.url;
  });

</script>

<main>
  <div class="bg" style="background-image: url('{bg}');">
    <div class="content">
      <div class="clock-container">
        <Clock />
      </div>
      <div class="sites-container">
        <Sites />
      </div>
    </div>
  </div>
</main>

<style>
  :global(html){
    padding: 0;
    margin: 0;
  }
  main {
    height: 100vh;
    width: 100vw;
  }
  .bg {
    width: 100%;
    height: 100%;
    background-position: center;
    background-size: cover;
    animation: fadeIn 1s;
    overflow: hidden;
    position: relative;
  }
  .bg::after {
    content: "";
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.3);
  }
  .content {
    position: relative;
    z-index: 1;
  }
  .clock-container {
    text-align: center;
  }
  .clock-container,
  .sites-container {
    margin-top: 10rem;
  }
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
