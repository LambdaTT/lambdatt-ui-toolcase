<template>
  <span
    class="fa-stack"
    style="vertical-align: middle; position: relative; display: inline-block"
  >
    <i class="fa-solid fa-mobile-screen-button fa-stack-2x"></i>
    <i
      class="fa-solid fa-wrench fa-stack-1x"
      style="
        position: absolute;
        bottom: 0px;
        right: 0px;
        left: auto;
        top: auto;
        width: auto;
        height: auto;
        line-height: normal;
        transform: translate(75%, 20%) scaleX(-1);
      "
    ></i>
  </span>
</template>

<script>
export default {
  name: "device-cog",
};
</script>
