import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent {

  // --- DATOS SIMULADOS DE LA TABLA ---
  users = [
    { id: 1, nombre: 'Ana', apellidos: 'García López', email: 'ana@ejemplo.com', rol: 'Estudiante', estado: 'Activo' },
    { id: 2, nombre: 'Carlos', apellidos: 'Ruiz', email: 'carlos@ejemplo.com', rol: 'Estudiante', estado: 'Inactivo' },
    { id: 3, nombre: 'Lucía', apellidos: 'Méndez', email: 'lucia@ejemplo.com', rol: 'Admin', estado: 'Activo' }
  ];

  // --- VARIABLES DE ESTADO ---
  selectedUser: any = null; // Guarda el usuario seleccionado
  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';

  // --- VARIABLES DEL FORMULARIO ---
  userForm = {
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  showPassword = false;
  showConfirmPassword = false;

  // --- FUNCIONES DE LA TABLA ---
  selectUser(user: any) {
    // Si hace clic en el mismo que ya está seleccionado, lo deselecciona
    if (this.selectedUser?.id === user.id) {
      this.selectedUser = null;
    } else {
      this.selectedUser = user;
    }
  }

  // --- FUNCIONES DEL MODAL Y FORMULARIO ---
  openModal(mode: 'create' | 'edit') {
    this.modalMode = mode;
    if (mode === 'edit' && this.selectedUser) {
      // Si es edición, cargamos los datos (sin la contraseña)
      this.userForm = {
        nombre: this.selectedUser.nombre,
        apellidos: this.selectedUser.apellidos,
        email: this.selectedUser.email,
        password: '',
        confirmPassword: ''
      };
    } else {
      // Limpiamos el formulario para crear nuevo
      this.userForm = { nombre: '', apellidos: '', email: '', password: '', confirmPassword: '' };
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveUser() {
    console.log('Guardando datos:', this.userForm);
    // Aquí iría la lógica para enviar a tu API/PostgreSQL
    this.closeModal();
    this.selectedUser = null; // Deseleccionamos tras guardar
  }

  deleteUser() {
    if(confirm(`¿Estás seguro de eliminar a ${this.selectedUser.nombre}?`)) {
      console.log('Eliminando:', this.selectedUser.id);
      // Lógica de eliminación...
      this.selectedUser = null;
    }
  }

  togglePasswordVisibility(field: 'pass' | 'confirm') {
    if (field === 'pass') this.showPassword = !this.showPassword;
    if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }
}