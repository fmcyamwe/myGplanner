<!--mostly for calendar planner-->
<template>
  <div class="q-pa-sm q-gutter-sm row justify-center smally">
    <q-btn
    no-caps
    class="button items-center"
    style="margin: 2px;"
    @click="$emit('prev')">
        &lt; Prev
    </q-btn>
    <q-separator vertical/>
    <q-btn
    no-caps
    class="button items-center"
    style="margin: 2px;"
    @click="$emit('today')">
        Today
    </q-btn>
    <q-separator vertical/>
    <q-btn
    no-caps
    class="button items-center"
    style="margin: 2px;"
    @click="$emit('next')">
        Next &gt;
    </q-btn>
  </div>
</template>

<style lang="sass" scoped>
@media (max-width: 500px)
  .smally
    transform: scale(.75)
</style>