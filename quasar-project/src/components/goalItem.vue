<!--for showing a goal item that is draggable -->
<template>
  <div class="goal-item"><!--q-mr-xs q-mb-xs q-px-sm -->
    <!--<div style="display: flex; align-items: center; justify-content: start; flex-wrap: nowrap;">
      <div style="max-width: 25px; min-width: 25px;"></div> -->

      <div class="ellipsis"> <!-- :style="userStyle"-->
        {{ title }}
        <q-tooltip>{{ time + ' - ' + details }}</q-tooltip>
      </div>
    </div>

    <!--<div style="display: flex; align-items: center; justify-content: start; flex-wrap: nowrap;">
      <div style="max-width: 25px; min-width: 25px;">
        <CurrencyDollar />
      </div>
      <div class="ellipsis col">{{ amount }}</div>
    </div> -->

    <!--<div style="display: flex; align-items: center; justify-content: start; flex-wrap: nowrap;">
      <div
        :style="overdueIconStyle"
      >
        <Alarm />
      </div>
      <div
        class="ellipsis"
        :style="overdueStyle"
      >
        {{ daysOver }} days overdue
      </div>
    </div>
  </div>-->
</template>

<script>
/*import Checkbox from '@carbon/icons-vue/es/checkbox/16'
import CheckboxChecked from '@carbon/icons-vue/es/checkbox--checked/16'
import Location from '@carbon/icons-vue/es/location/16'
import Email from '@carbon/icons-vue/es/email/16'
import Phone from '@carbon/icons-vue/es/phone/16'
import Construction from '@carbon/icons-vue/es/construction/16'
import Calendar from '@carbon/icons-vue/es/calendar/16'
import CurrencyDollar from '@carbon/icons-vue/es/currency--dollar/16'
import Alarm from '@carbon/icons-vue/es/alarm/16'
*/
export default {
  name: 'GoalItem',
  //components: {
  //  Checkbox,
  //  CheckboxChecked,
  //  Location,
  //  Email,
  //  Phone,
  //  Construction,
  //  Calendar,
  //  CurrencyDollar,
   // Alarm
  //},
  props: {
    modelValue: Boolean,
    title: String,
    time: String,
    details: String,
    //address: String,
    //email: String,
    //phone: String,
    //workDate: String,
    //amount: String,
    //daysOver: Number
  },
  emits: [
    'update:model-value'
  ],
  computed: {
    overdueIconStyle () {
      return {
        color: (this.daysOver === 0 ? 'inherit' : 'red'),
        'max-width': '25px',
        'min-width': '25px'
      }
    },
    overdueStyle () {
      return {
        color: (this.daysOver === 0 ? 'inherit' : 'red')
      }
    },
    userIconStyle () {
      return {
        color: this.modelValue === true ? 'red' : 'blue',
        cursor: 'pointer'
      }
    },
    userStyle () {
      return {
        color: this.modelValue === true ? 'red' : 'blue'
      }
    }
  },
  watch: {
    title (val) { //modelValue
       console.log('titleValue:', val)
    }
  },
  methods: {
    onClicked () { //not hooked background: #fff
       console.log('huh a click doing nothing')
      this.$emit('update:model-value', !this.modelValue)
    }
  }
}
</script>

<style lang="sass" scoped>
.goal-item
  border: 1px solid transparent
  box-shadow: 0 1px 5px rgb(0 0 0 / 20%), 0 2px 2px rgb(0 0 0 / 14%), 0 3px 1px -2px rgb(0 0 0 / 12%)
  border-radius: 4px
  vertical-align: top
  padding: 2px
  margin: 2px
  margin-bottom: 4px
  font-size: 12px
  &:hover
    border: 1px solid rgba(0,140,200,.8)
</style>