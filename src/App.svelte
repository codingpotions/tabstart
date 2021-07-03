<script>
  import { getTopWallpaper } from "./services/reddit.js";
  import { onMount } from "svelte";
  import Clock from "./Clock.svelte";

  let bg = null;

  onMount(async () => {
    const bgResponse = await getTopWallpaper();
    bg = bgResponse.data.children[0].data.url;
  });

</script>

<main class="overlay">
  <div class="bg" style="background-image: url('{bg}');">
    <div class="clock-container">
      <Clock />
    </div>
  </div>
</main>

<style>
  :global(html){
    padding: 0;
    margin: 0;
  }
  .overlay {
    height: 100vh;
    width: 100vw;
    background: rgba(0, 0, 0, 0.3);
  }
  .bg {
    width: 100%;
    height: 100%;
    background-position: center;
    background-size: cover;
    animation: fadeIn 1s;
    overflow: hidden;
  }
  .clock-container {
    text-align: center;
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
