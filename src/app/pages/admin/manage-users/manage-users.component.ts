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
    { id: 3, nombre: 'Lucía', apellidos: 'Méndez', email: 'lucia@ejemplo.com', rol: 'Admin', estado: 'Activo' },
    { id: 4, nombre: 'Juan', apellidos: 'Pérez', email: 'juan@ejemplo.com', rol: 'Estudiante', estado: 'Activo' },
    { id: 5, nombre: 'María', apellidos: 'Rodríguez', email: 'maria@ejemplo.com', rol: 'Admin', estado: 'Activo' },
    { id: 6, nombre: 'Pedro', apellidos: 'Sánchez', email: 'pedro@ejemplo.com', rol: 'Estudiante', estado: 'Inactivo' },
    { id: 7, nombre: 'Laura', apellidos: 'Martínez', email: 'laura@ejemplo.com', rol: 'Estudiante', estado: 'Activo' },
    { id: 8, nombre: 'Diego', apellidos: 'Gómez', email: 'diego@ejemplo.com', rol: 'Admin', estado: 'Activo' },
    { id: 9, nombre: 'Elena', apellidos: 'Fernández', email: 'elena@ejemplo.com', rol: 'Estudiante', estado: 'Activo' },
    { id: 10, nombre: 'Miguel', apellidos: 'Torres', email: 'miguel@ejemplo.com', rol: 'Estudiante', estado: 'Inactivo' },
    { id: 11, nombre: 'Sofía', apellidos: 'Vázquez', email: 'sofia@ejemplo.com', rol: 'Estudiante', estado: 'Activo' },
    { id: 12, nombre: 'Javier', apellidos: 'Castro', email: 'javier@ejemplo.com', rol: 'Admin', estado: 'Inactivo' },
    { id: 13, nombre: 'Carmen', apellidos: 'Navarro', email: 'carmen@ejemplo.com', rol: 'Estudiante', estado: 'Activo' },
    { id: 14, nombre: 'Alejandro', apellidos: 'Morales', email: 'alejandro@ejemplo.com', rol: 'Estudiante', estado: 'Activo' },
    { id: 15, nombre: 'Isabel', apellidos: 'Ortega', email: 'isabel@ejemplo.com', rol: 'Estudiante', estado: 'Inactivo' },
    { id: 16, nombre: 'Ricardo', apellidos: 'Delgado', email: 'ricardo@ejemplo.com', rol: 'Admin', estado: 'Activo' },
    { id: 17, nombre: 'Beatriz', apellidos: 'Marín', email: 'beatriz@ejemplo.com', rol: 'Estudiante', estado: 'Activo' },
    { id: 18, nombre: 'Fernando', apellidos: 'Rubio', email: 'fernando@ejemplo.com', rol: 'Estudiante', estado: 'Inactivo' },
    { id: 19, nombre: 'Marta', apellidos: 'Sanz', email: 'marta@ejemplo.com', rol: 'Estudiante', estado: 'Activo' },
    { id: 20, nombre: 'Hugo', apellidos: 'Jiménez', email: 'hugo@ejemplo.com', rol: 'Admin', estado: 'Activo' },
    { id: 21, nombre: 'Paula', apellidos: 'Iglesias', email: 'paula@ejemplo.com', rol: 'Estudiante', estado: 'Activo' },
    { id: 22, nombre: 'Jorge', apellidos: 'Herrero', email: 'jorge@ejemplo.com', rol: 'Estudiante', estado: 'Inactivo' },
    { id: 23, nombre: 'Raquel', apellidos: 'Medina', email: 'raquel@ejemplo.com', rol: 'Estudiante', estado: 'Activo' }
  ];

  // --- VARIABLES DE ESTADO ---
  selectedUsers: any[] = []; // Guarda los usuarios seleccionados
  isModalOpen = false;
  modalMode: 'create' | 'edit' | 'view' = 'create';
  viewedUserIndex: number = -1; // Para la navegación con flechas
  isFormDirty = false; // Para detectar cambios sin guardar
  showUnsavedOverlay = false;
  pendingNavigationAction: (() => void) | null = null;

  searchTerm: string = '';
  filterRole: string = '';

  // --- PAGINACIÓN ---
  currentPage = 1;
  itemsPerPage = 10;
  itemsPerPageOptions = [5, 10, 25, 50];

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
  isSubmitting = false;
  toastMessage = '';
  showToast = false;

  // --- FUNCIONES DE LA TABLA ---
  get filteredUsersList() {
    return this.users.filter(u => {
      const matchesSearch =
        u.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        u.apellidos.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = this.filterRole ? u.rol === this.filterRole : true;

      return matchesSearch && matchesRole;
    });
  }

  // Paginación Calculada
  get totalPages() {
    return Math.ceil(this.filteredUsersList.length / Number(this.itemsPerPage)) || 1;
  }

  get paginatedUsers() {
    const limit = Number(this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * limit;
    return this.filteredUsersList.slice(startIndex, startIndex + limit);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1; // Reiniciar a la primera página si cambiamos el límite
  }

  toggleUserSelection(user: any, event?: Event) {
    if (event) event.stopPropagation();
    const index = this.selectedUsers.findIndex(u => u.id === user.id);
    if (index > -1) {
      this.selectedUsers.splice(index, 1);
    } else {
      this.selectedUsers.push(user);
    }
  }

  clearSelection() {
    this.selectedUsers = [];
  }

  isSelected(user: any): boolean {
    return this.selectedUsers.some(u => u.id === user.id);
  }

  // --- FUNCIONES DEL MODAL ---
  openModal(mode: 'create' | 'edit' | 'view', user?: any, event?: Event) {
    if (event) event.stopPropagation();
    this.modalMode = mode;
    this.isFormDirty = false;

    if ((mode === 'edit' || mode === 'view') && user) {
      this.viewedUserIndex = this.filteredUsersList.findIndex(u => u.id === user.id);
      this.loadUserForm(user);
    } else if (mode === 'edit' && this.selectedUsers.length === 1) {
      this.viewedUserIndex = this.filteredUsersList.findIndex(u => u.id === this.selectedUsers[0].id);
      this.loadUserForm(this.selectedUsers[0]);
    } else {
      // Create mode
      this.userForm = { nombre: '', apellidos: '', email: '', password: '', confirmPassword: '' };
      this.viewedUserIndex = -1;
    }
    this.isModalOpen = true;
  }

  loadUserForm(user: any) {
    this.userForm = {
      nombre: user.nombre,
      apellidos: user.apellidos,
      email: user.email,
      password: '',
      confirmPassword: ''
    };
    this.isFormDirty = false;
  }

  onFormChange() {
    this.isFormDirty = true;
  }

  closeModal() {
    if ((this.modalMode === 'create' || this.modalMode === 'edit') && this.isFormDirty) {
      this.pendingNavigationAction = () => { this.isModalOpen = false; };
      this.showUnsavedOverlay = true;
      return;
    }
    this.isModalOpen = false;
  }

  confirmUnsavedChanges() {
    this.showUnsavedOverlay = false;
    this.isFormDirty = false;
    if (this.pendingNavigationAction) {
      this.pendingNavigationAction();
      this.pendingNavigationAction = null;
    }
  }

  cancelUnsavedChanges() {
    this.showUnsavedOverlay = false;
    this.pendingNavigationAction = null;
  }

  // --- FLECHAS DE NAVEGACION ---
  navigationAlertAndProceed(callback: () => void) {
    if ((this.modalMode === 'create' || this.modalMode === 'edit') && this.isFormDirty) {
      this.pendingNavigationAction = callback;
      this.showUnsavedOverlay = true;
    } else {
      callback();
    }
  }

  previousUser() {
    this.navigationAlertAndProceed(() => {
      if (this.viewedUserIndex > 0) {
        this.viewedUserIndex--;
        const user = this.filteredUsersList[this.viewedUserIndex];
        this.loadUserForm(user);
      }
    });
  }

  nextUser() {
    this.navigationAlertAndProceed(() => {
      if (this.viewedUserIndex < this.filteredUsersList.length - 1 && this.viewedUserIndex >= 0) {
        this.viewedUserIndex++;
        const user = this.filteredUsersList[this.viewedUserIndex];
        this.loadUserForm(user);
      }
    });
  }

  switchToEdit() {
    this.modalMode = 'edit';
    this.isFormDirty = false;
  }

  // --- GUARDAR Y ELIMINAR ---
  saveUser() {
    if (!this.userForm.nombre.trim() || !this.userForm.apellidos.trim() || !this.userForm.email.trim()) {
      this.displayToast('Por favor, completa todos los campos obligatorios.', true);
      return;
    }

    if (this.modalMode === 'create' && (!this.userForm.password || this.userForm.password !== this.userForm.confirmPassword)) {
      this.displayToast('Las contraseñas no coinciden o están vacías.', true);
      return;
    }

    this.isSubmitting = true;

    setTimeout(() => {
      if (this.modalMode === 'edit') {
        const user = this.filteredUsersList[this.viewedUserIndex];
        const originalIndex = this.users.findIndex(u => u.id === user.id);
        if (originalIndex > -1) {
          this.users[originalIndex].nombre = this.userForm.nombre;
          this.users[originalIndex].apellidos = this.userForm.apellidos;
          this.users[originalIndex].email = this.userForm.email;
        }
      } else {
        const newId = (this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) : 0) + 1;
        this.users.unshift({
          id: newId,
          nombre: this.userForm.nombre,
          apellidos: this.userForm.apellidos,
          email: this.userForm.email,
          rol: 'Estudiante',
          estado: 'Activo'
        });
      }

      this.isSubmitting = false;
      this.isFormDirty = false;
      this.displayToast(this.modalMode === 'create' ? 'Usuario creado exitosamente.' : 'Usuario actualizado exitosamente.');
      this.isModalOpen = false;
      // Actualizar listado y selección si fuese necesario
    }, 800);
  }

  deleteSelectedUsers() {
    if (this.selectedUsers.length === 0) return;

    const count = this.selectedUsers.length;
    const msg = count > 1
      ? `¿Estás seguro de eliminar a los ${count} usuarios seleccionados?`
      : `¿Estás seguro de eliminar a ${this.selectedUsers[0].nombre}?`;

    if (confirm(msg)) {
      this.isSubmitting = true;
      setTimeout(() => {
        this.users = this.users.filter(u => !this.selectedUsers.some(su => su.id === u.id));
        this.isSubmitting = false;
        this.displayToast(count > 1 ? 'Usuarios eliminados correctamente.' : 'Usuario eliminado correctamente.');
        this.selectedUsers = [];
      }, 600);
    }
  }

  deleteUserFromModal() {
    const user = this.filteredUsersList[this.viewedUserIndex];
    if (confirm(`¿Estás seguro de eliminar a ${user.nombre}?`)) {
      this.isSubmitting = true;
      setTimeout(() => {
        this.users = this.users.filter(u => u.id !== user.id);
        this.selectedUsers = this.selectedUsers.filter(u => u.id !== user.id);
        this.isSubmitting = false;
        this.displayToast('Usuario eliminado correctamente.');
        this.isModalOpen = false;
      }, 600);
    }
  }

  togglePasswordVisibility(field: 'pass' | 'confirm') {
    if (field === 'pass') this.showPassword = !this.showPassword;
    if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }

  displayToast(message: string, isError: boolean = false) {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}