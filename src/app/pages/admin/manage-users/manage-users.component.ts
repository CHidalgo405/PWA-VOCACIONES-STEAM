import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import { AdminSidebarComponent } from '../../../components/admin-sidebar/admin-sidebar.component';
import { AdminService, AdminUser } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AuthService } from '../../../core/services/auth.service';
import { catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';
import { LucideIconComponent } from '../../../components/lucide-icon/lucide-icon.component';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, AdminSidebarComponent, FormsModule, LucideIconComponent],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit {

  // --- DATOS REALES DE LA TABLA ---
  users: AdminUser[] = [];

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

  // --- ORDENAMIENTO ---
  sortColumn: 'fullname' | 'email' | 'role' | 'createdAt' | 'isEmailVerified' = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  sortBy(column: typeof this.sortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
  }

  /** Ícono a mostrar en el encabezado: neutral si no es la columna activa. */
  sortIcon(column: typeof this.sortColumn): string {
    if (this.sortColumn !== column) return 'arrow-up-down';
    return this.sortDirection === 'asc' ? 'arrow-up' : 'arrow-down';
  }

  // --- PAGINACIÓN ---
  currentPage = 1;
  itemsPerPage = 10;
  itemsPerPageOptions = [5, 10, 25, 50];

  isLoading = true;
  skeletonArray = Array(5).fill(0); // 5 filas de skeleton

  constructor(
    private adminService: AdminService, 
    private toastService: ToastService, 
    private authService: AuthService,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getAllUsers().pipe(
      catchError(err => {
        this.isLoading = false;
        this.toastService.showToast('Error cargando los usuarios. ' + (err.error?.message || ''), 'error');
        return of([]);
      })
    ).subscribe((data: AdminUser[]) => {
      this.isLoading = false;
      this.users = data;
    });
  }

  // --- VARIABLES DEL FORMULARIO ---
  userForm = {
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    title: '',
    isEmailVerified: false,
    settings: {
      darkMode: false,
      language: 'Español',
      pushEnabled: false,
      emailMarketing: false
    },
    createdAt: '',
    updatedAt: '',
    avatarUrl: null as string | null
  };

  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;
  toastMessage = '';
  showToast = false;

  // --- FUNCIONES DE LA TABLA ---
  get filteredUsersList() {
    const filtered = this.users.filter(u => {
      const splitName = u.fullname ? u.fullname.split(' ') : [''];
      const nombre = splitName[0];
      const apellidos = splitName.slice(1).join(' ');

      const matchesSearch =
        nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        apellidos.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const normalizedRole = u.role === 'admin' ? 'Admin' : 'Estudiante';
      const matchesRole = this.filterRole ? normalizedRole === this.filterRole : true;

      return matchesSearch && matchesRole;
    });

    const col = this.sortColumn;
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      let valA: string | number = a[col] as any;
      let valB: string | number = b[col] as any;

      if (col === 'createdAt') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (col === 'isEmailVerified') {
        valA = a.isEmailVerified ? 1 : 0;
        valB = b.isEmailVerified ? 1 : 0;
      } else {
        valA = String(valA ?? '').toLowerCase();
        valB = String(valB ?? '').toLowerCase();
      }

      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
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
      this.userForm = { 
        nombre: '', 
        apellidos: '', 
        email: '', 
        password: '', 
        confirmPassword: '',
        role: 'student',
        title: '',
        isEmailVerified: false,
        settings: {
          darkMode: false,
          language: 'Español',
          pushEnabled: false,
          emailMarketing: false
        },
        createdAt: '',
        updatedAt: '',
        avatarUrl: null
      };
      this.viewedUserIndex = -1;
    }
    this.isModalOpen = true;
  }

  loadUserForm(user: any) {
    // Si viene la API string fullname, lo separamos para el form frontend visual
    const splitName = user.fullname ? user.fullname.split(' ') : [''];
    this.userForm = {
      nombre: splitName[0] || '',
      apellidos: splitName.slice(1).join(' ') || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      role: user.role || 'student',
      title: user.title || '',
      isEmailVerified: !!user.isEmailVerified,
      settings: user.settings ? { ...user.settings } : {
        darkMode: false,
        language: 'Español',
        pushEnabled: false,
        emailMarketing: false
      },
      createdAt: user.createdAt || '',
      updatedAt: user.updatedAt || '',
      avatarUrl: user.avatarUrl || null
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

    const payload = {
      fullname: `${this.userForm.nombre.trim()} ${this.userForm.apellidos.trim()}`,
      email: this.userForm.email.trim()
    };

    if (this.modalMode === 'edit') {
      const user = this.filteredUsersList[this.viewedUserIndex];
      this.adminService.updateUser(user.id, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.isFormDirty = false;
          this.displayToast('Usuario actualizado exitosamente.');
          this.isModalOpen = false;
          this.loadUsers();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.displayToast('Error actualizando: ' + (err.error?.message || ''), true);
        }
      });
    } else {
      this.authService.register(payload.email, payload.fullname, this.userForm.password).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          this.isFormDirty = false;
          this.displayToast('Usuario creado exitosamente. Se le ha enviado el código OTP.');
          this.isModalOpen = false;
          this.loadUsers();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.displayToast('Error al crear usuario: ' + (err.error?.message || ''), true);
        }
      });
    }
  }

  async deleteSelectedUsers() {
    if (this.selectedUsers.length === 0) return;

    const count = this.selectedUsers.length;
    const msg = count > 1
      ? `¿Estás seguro de eliminar a los ${count} usuarios seleccionados?`
      : `¿Estás seguro de eliminar a ${this.selectedUsers[0].nombre}?`;

    const confirmed = await this.dialogService.confirm(
      'Eliminar Usuarios',
      msg,
      { confirmText: 'Sí, eliminar', isDanger: true }
    );

    if (confirmed) {
      this.isSubmitting = true;
      const deleteObservables = this.selectedUsers.map(su => this.adminService.deleteUser(su.id));

      forkJoin(deleteObservables).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.displayToast(count > 1 ? 'Usuarios eliminados correctamente.' : 'Usuario eliminado correctamente.');
          this.selectedUsers = [];
          this.loadUsers();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.displayToast('Hubo un error al eliminar algunos usuarios.', true);
          this.loadUsers();
        }
      });
    }
  }

  async deleteUserFromModal() {
    const user = this.filteredUsersList[this.viewedUserIndex];
    
    const confirmed = await this.dialogService.confirm(
      'Eliminar Usuario',
      `¿Estás seguro de eliminar a ${user.fullname}?`,
      { confirmText: 'Sí, eliminar', isDanger: true }
    );

    if (confirmed) {
      this.isSubmitting = true;
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.selectedUsers = this.selectedUsers.filter(u => u.id !== user.id);
          this.displayToast('Usuario eliminado correctamente.');
          this.isModalOpen = false;
          this.loadUsers();
        },
        error: (err) => {
          this.isSubmitting = false;
          this.displayToast('Error al eliminar: ' + (err.error?.message || ''), true);
        }
      });
    }
  }

  togglePasswordVisibility(field: 'pass' | 'confirm') {
    if (field === 'pass') this.showPassword = !this.showPassword;
    if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
  }

  displayToast(message: string, isError: boolean = false) {
    this.toastService.showToast(message, isError ? 'error' : 'success');
  }
}