
<script>
  import {onMount} from "svelte";
  import { createEventDispatcher } from "svelte";
  import { linearMap } from "./logic/helpers.js";

  const dispatch = createEventDispatcher();

  let slider = null;

  export let value = 0;
  export let min = 0;
  export let max = 10;

  export let label = ""; 
  $: id = "slider-" + label.replace(/\s+/g, '-').toLowerCase();

  onMount(() => {
    updateValue();
  })

  $: currentValuePercent = () => {
    const currentPercent = (value - min) / (max - min) * 100;

    // TODO: Magic number
    return linearMap(currentPercent, 0, 100, 1.1, 98.9);
  }

  $: if (value) {
     updateValue(value);
   };

  function updateValue(newValue) {
    if (slider) {
      const srcElement = slider;
      const min = parseInt(srcElement.min);
      const max = parseInt(srcElement.max);
      const value = newValue ? newValue : parseInt(srcElement.value);
      const percent = (value - min) / (max - min) * 100;
      srcElement.style.background = "linear-gradient(to right, #82CFD0 0%, #82CFD0 " + percent + "%, #fff " + percent + "%, white 100%)";
    }
  }

  function sliderHandler(e) {
    updateValue();
    dispatch("updated", { value: e.srcElement.value });
  }

</script>

<div class="slider-container">
  {#if label }
    <label for="#{id}">{label}</label>
  {/if }
  {#if value }
    <div class="current-value" style="left: {currentValuePercent()}%">{value}</div>
  {/if }
  <input id="{id}" on:input="{sliderHandler}" bind:this={slider} type="range" min="{min}" max="{max}" value="{value}" class="slider">
  <div class="values">
    <div class="min">{min}</div>
    <div class="max">{max}</div>
  </div>
</div>

<style>
  .slider-container {
    position: relative;
  }
  label {
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  label:first-letter {
    text-transform: capitalize;
  }
  .slider {
    background: linear-gradient(to right, #82CFD0 0%, #82CFD0 50%, #fff 50%, #fff 100%);
    border: solid 1px #82CFD0;
    border-radius: 8px;
    height: 7px;
    width: 356px;
    outline: none;
    transition: background 450ms ease-in;
    -webkit-appearance: none;
    width: 100%;
    margin-top: 2rem;
  }
  .current-value {
    position: absolute;
    transform: translateX(-50%);
  }
  .values {
    display: flex;
    justify-content: space-between;
  }
</style>
