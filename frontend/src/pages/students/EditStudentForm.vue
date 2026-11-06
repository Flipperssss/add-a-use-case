<template>
  <el-form
    ref="studentForm"
    :model="studentBeingEdited"
    :rules="rules"
    label-width="110px"
    style="padding-right: 30px"
    label-position="left"
  >
    <el-form-item label="Id:">
      <el-input v-model="studentBeingEdited.id" disabled></el-input>
    </el-form-item>
    <el-form-item label="Username:" prop="username">
      <el-input v-model="studentBeingEdited.username"></el-input>
    </el-form-item>
    <el-form-item label="Status:">
      <el-tag data-cy="student-status" :type="studentBeingEdited.enabled ? 'success' : 'danger'">
        {{ studentBeingEdited.enabled ? 'Active' : 'Deactivated' }}
      </el-tag>
    </el-form-item>
    <el-form-item label="First Name:" prop="firstName">
      <el-input v-model="studentBeingEdited.firstName"></el-input>
    </el-form-item>
    <el-form-item label="Last Name:" prop="lastName">
      <el-input v-model="studentBeingEdited.lastName"></el-input>
    </el-form-item>
    <el-form-item label="Email:" prop="email">
      <el-input v-model="studentBeingEdited.email"></el-input>
    </el-form-item>
    <el-form-item label="Team:" prop="teamName">
      <el-input v-model="studentBeingEdited.teamName" disabled></el-input>
    </el-form-item>
    <div style="display: flex; justify-content: end">
      <el-button
        v-if="studentBeingEdited.enabled"
        data-cy="student-deactivate"
        type="danger"
        :loading="deactivationLoading"
        @click="deactivationConfirmationVisible = true"
      >
        Deactivate
      </el-button>
      <el-button
        v-else
        type="success"
        :loading="deactivationLoading"
        @click="reactivateExistingStudent"
      >
        Reactivate
      </el-button>
      <el-button @click="$emit('close-dialog')"> Cancel </el-button>
      <el-button type="primary" @click="updateExistingStudent()"> Confirm </el-button>
    </div>
    <el-dialog
      v-model="deactivationConfirmationVisible"
      title="Deactivate student"
      width="500px"
      data-cy="student-deactivation-confirmation"
    >
      <p>
        This will stop the student's access to Project Pulse, including access using previously
        issued tokens. Their course-section and team memberships, weekly activity reports, and peer
        evaluations will be retained. They will not be eligible for new peer evaluations, but
        existing evaluations remain editable until their submission window closes. The student will
        not be notified.
      </p>
      <template #footer>
        <el-button
          data-cy="student-deactivation-cancel"
          @click="deactivationConfirmationVisible = false"
        >
          Cancel
        </el-button>
        <el-button
          data-cy="student-deactivation-submit"
          type="danger"
          :loading="deactivationLoading"
          @click="deactivateExistingStudent"
        >
          Confirm deactivation
        </el-button>
      </template>
    </el-dialog>
  </el-form>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { Student } from '@/apis/student/types'
import type { FormInstance } from 'element-plus'
import {
  deactivateStudent as deactivateStudentApi,
  findStudentById,
  updateStudent
} from '@/apis/student'
import { ref, onMounted } from 'vue'

const { studentId } = defineProps(['studentId'])
const emit = defineEmits(['close-dialog'])

// Note that the structure of the userData is NOT the same as the User interface since the roles are stored as an array
const studentBeingEdited = ref<Student>({
  // Data of the user being added or edited
  id: NaN,
  username: '',
  enabled: false,
  firstName: '',
  lastName: '',
  email: ''
})

const studentForm = ref<FormInstance>() // Form reference
const deactivationConfirmationVisible = ref(false)
const deactivationLoading = ref(false)

// Validation rules
const rules = {
  username: [
    { required: true, message: 'Please input your email as your username', trigger: 'blur' },
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Enter your email as username.',
      trigger: 'blur'
    }
  ],
  enabled: [{ required: true, message: 'Please select the status of the user.', trigger: 'blur' }],
  firstName: [
    { required: true, message: 'Please provide the first name of the user.', trigger: 'blur' }
  ],
  lastName: [
    { required: true, message: 'Please provide the last name of the user.', trigger: 'blur' }
  ],
  email: [
    { required: true, message: 'Please provide the email of the user.', trigger: 'blur' },
    { type: 'email', message: 'Please provide a valid email.', trigger: 'blur' }
  ]
}

async function loadStudent(studentId: number) {
  // Load the user to be edited
  const result = await findStudentById(studentId)

  studentBeingEdited.value.id = result.data.id as number
  studentBeingEdited.value.username = result.data.username
  studentBeingEdited.value.enabled = result.data.enabled
  studentBeingEdited.value.firstName = result.data.firstName
  studentBeingEdited.value.lastName = result.data.lastName
  studentBeingEdited.value.email = result.data.email
  studentBeingEdited.value.teamName = result.data.teamName
}

onMounted(() => {
  loadStudent(studentId) // Load the artifact to be edited
})

async function updateExistingStudent() {
  await studentForm.value!.validate() // Validate the form

  await updateStudent(studentUpdate(studentBeingEdited.value.enabled === true))

  ElMessage.success('Student updated successfully')
  emit('close-dialog')
}

async function deactivateExistingStudent() {
  const studentId = studentBeingEdited.value.id
  if (studentId === undefined || !Number.isInteger(studentId)) {
    throw new Error('Cannot deactivate a student without a valid id.')
  }

  deactivationLoading.value = true
  try {
    await deactivateStudentApi(studentId)
    deactivationConfirmationVisible.value = false
    ElMessage.success('Student deactivated successfully')
    emit('close-dialog')
  } finally {
    deactivationLoading.value = false
  }
}

async function reactivateExistingStudent() {
  deactivationLoading.value = true
  try {
    await updateStudent(studentUpdate(true))
    ElMessage.success('Student reactivated successfully')
    emit('close-dialog')
  } finally {
    deactivationLoading.value = false
  }
}

function studentUpdate(enabled: boolean): Student {
  return {
    id: studentBeingEdited.value.id,
    username: studentBeingEdited.value.username,
    enabled,
    firstName: studentBeingEdited.value.firstName,
    lastName: studentBeingEdited.value.lastName,
    email: studentBeingEdited.value.email
  }
}
</script>

<style scoped lang="scss"></style>
