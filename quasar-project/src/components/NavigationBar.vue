<!--mostly for calendar planner-->
<template>
  <div class="row justify-center">
    <div class="q-pa-md q-gutter-sm row">
      <q-btn
        no-caps
        class="button"
        style="margin: 2px;"
        @click="$emit('prev')"
      >
        &lt; Prev
      </q-btn>
      <q-separator vertical/>
      <q-btn
        no-caps
        class="button justify-center items-center"
        style="margin: 2px;"
        @click="$emit('today')"
      >
        Today
      </q-btn>
      <q-separator vertical/>
      <q-btn
        no-caps
        class="button"
        style="margin: 2px;"
        @click="$emit('next')"
      >
        Next &gt;

      </q-btn> 
      <q-separator />
    </div>
  </div>
</template>