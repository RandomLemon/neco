<script lang="ts" setup>
const projectUrl = 'https://github.com/orgs/nju-mc-org/projects/4'
</script>

<template>
  <div class="management-tab-title-container">
    <h1 class="management-tab-title">社团管理</h1>
    <span class="management-tab-subtitle">这么强？！</span>
  </div>

  <section class="management-section" aria-labelledby="club-management-title">
    <div class="management-section-header">
      <div class="management-section-title-block">
        <h2 id="club-management-title" class="management-section-title">当前管理流程</h2>
        <p class="management-section-desc">
          目前仅运保部存在独立看板流程；如果你的账号有权限，可以前往 GitHub Project 查看。
        </p>
      </div>
    </div>

    <div class="club-card-grid">
      <article class="management-card">
        <h3 class="management-card-title">运保部看板</h3>
        <p class="club-card-text">
          运保部任务、维护事项和排期已经迁移到 GitHub Project。后台暂时只作为入口提示。
        </p>

        <a class="club-project-link" :href="projectUrl" target="_blank" rel="noopener noreferrer">
          打开 GitHub 看板
        </a>
      </article>

      <article class="management-card">
        <h3 class="management-card-title">其它社团流程</h3>
        <p class="club-card-text">
          其它部门暂未接入后台管理。后续如果需要，可以在这里扩展社团成员、任务、活动报名等模块。
        </p>
      </article>
    </div>

    <div class="management-empty-state">
      <strong>暂无更多后台功能</strong>
      <span>当前页面用于说明和跳转，不会修改服务器数据。</span>
    </div>
  </section>
</template>

<style lang="css" scoped>
.club-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 1rem;
}

.club-card-text {
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.74);
  line-height: 1.45rem;
}

.club-project-link {
  display: inline-flex;
  color: var(--minecraft-green-light);
  text-decoration: underline;
}

.club-project-link:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}
</style>
