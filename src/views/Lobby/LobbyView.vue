<script lang="ts" setup>
import Intro from './IntroView.vue'
</script>

<template>
  <div>
    <div class="main-area">
      <div class="logo-area">
        <div class="logo-content">
          <div>
            <img src="/nmo-logo-large.png" alt="LOGO" style="height: 5rem" />
          </div>
          <p>南京大学<span class="title-font">Minecraft</span>协会</p>
          <span class="intro-text"
            >在 Minecraft
            基础上，发展建筑，计算机，软件，电路，建模等方面的知识水平，充分利用同学们的兴趣，形成具有南大特色的
            mc 社区文化，进一步提升学校影响力。</span
          >
        </div>
      </div>
    </div>
    <Intro />
  </div>
</template>

<style lang="css" scoped>
.main-area {
  width: 100%;
  height: 40rem;
  display: flex;
  background-image: url('/background/beidalou.webp');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  position: relative;

  text-shadow: 2px 2px 2px black;
}

.main-area::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 5rem;
  background: linear-gradient(to bottom, transparent 0%, var(--background-color) 100%);
}

.logo-area {
  width: 50%;
  height: 100%;
  min-width: 25rem;
  display: flex;
  align-items: center;

}

.logo-content {
  display: flex;
  flex-direction: column;
  /* border-left: 4px solid #fff; */
  padding-left: 10%;
  max-width: 30rem;
  padding-right: 10%;
  animation: fade-in-right 1s ease-out forwards;
}

.logo-content p {
  font-size: 2rem;
  font-weight: bold;
  color: #fff;
  margin-top: 0;
  margin-bottom: 0;
  text-wrap: nowrap;
}

.intro-text {
  font-size: 1.15rem;
  font-weight: bold;
}

@media screen and (max-width: 623px) {
  .logo-content p {
    text-wrap: wrap;
  }
}
</style>
