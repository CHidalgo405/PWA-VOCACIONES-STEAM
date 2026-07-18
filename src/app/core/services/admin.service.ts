import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminUser {
  id: string;
  email: string;
  fullname: string;
  role: 'student' | 'admin';
  title?: string;
  level: number;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  avatarUrl?: string | null;
  settings?: Record<string, unknown>;
  // Moderación
  isBanned?: boolean;
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
}

export type SuspensionAction = 'suspend' | 'ban' | 'reactivate';

export interface AdminStats {
  totals: {
    users: number;
    students: number;
    admins: number;
    moderated: number;
    tests: number;
    testsThisWeek: number;
    testsThisMonth: number;
    simulators: number;
    questions: number;
  };
  distribution: {
    ciencia: number;
    tecnologia: number;
    ingenieria: number;
    artes: number;
    matematicas: number;
  };
  recentUsers: {
    fullname: string;
    email: string;
    createdAt: string;
    dominantTraits: string | null;
    hasTest: boolean;
  }[];
}

export interface AdminTestOption {
  id?: string;
  text: string;
  letter: string;
  steamTrait: string;
}

export interface AdminTestQuestion {
  id: string;
  text: string;
  order: number;
  status?: string;
  options: AdminTestOption[];
}

export interface RecentLogItem {
  id: string;
  date: string;
  studentName: string;
  detectedProfile: string;
  latency: string;
  status: string;
  provider?: string;
  tokensConsumed?: number;
  errorMessage?: string | null;
}

export interface AiLogsStatsResponse {
  successRate: string;
  averageLatency: string;
  totalTokens: string;
  recentLogs: RecentLogItem[];
}

export type SteamAxis = 'ciencia' | 'tecnologia' | 'ingenieria' | 'artes' | 'matematicas';

export interface AdminSimulator {
  id: string;
  slug: string;
  careerName: string;
  steamArea: SteamAxis;
  estimatedDurationMinutes: number;
  difficulty: string;
  status: 'activo' | 'inactivo';
  colorToken: string;
  icon: string;
  shortDescription: string;
  tags: string[];
  steps: any[];
  completionConfig?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'configured' | 'degraded' | 'unconfigured';
  latencyMs: number | null;
  detail: string;
}

export interface SystemOverview {
  generatedAt: string;
  environment: {
    nodeEnv: string;
    nodeVersion: string;
    commit: string | null;
    uptimeSeconds: number;
  };
  services: SystemServiceStatus[];
  database: {
    name: string;
    sizeBytes: number;
    connections: number;
    latencyMs: number;
  };
  counts: Record<string, number>;
  quality: {
    orphanOptions: number;
    invalidSimulators: number;
    inactiveSimulators: number;
    unverifiedUniversities: number;
    failedUniversityEnrichments: number;
    legacyProfiles: number;
    unverifiedUsers: number;
  };
}

export interface VocationCatalogItem {
  id: string;
  axis: SteamAxis;
  name: string;
  description: string;
  skills: string[];
  icon: string;
}

export interface CareerCatalogItem {
  id: string;
  axis: SteamAxis;
  careerName: string;
  studyPlanHighlights: string[];
  careerFields: string[];
  relatedSimulatorSlug?: string | null;
  icon: string;
}

export interface AxisMetaItem {
  axis: SteamAxis;
  label: string;
  adjective: string;
  icon: string;
  archetype: string;
  strengthTitle: string;
  strengthDesc: string;
  workStyle: string[];
}

export interface AdminCatalogs {
  vocations: VocationCatalogItem[];
  careers: CareerCatalogItem[];
  axisMeta: AxisMetaItem[];
}

/** Candidata para el algoritmo A8 (matching de universidades). */
export interface AdminUniversity {
  id?: string;
  name: string;
  address?: string;
  website?: string;
  location?: { latitude: number; longitude: number };
  steamPrograms?: { name: string; area: string; sourceUrl?: string }[];
  costTier?: 'public' | 'affordable' | 'private-premium';
  tuitionRange?: string;
  rating?: number;
  modality?: string;
  programsVerifiedAt?: string | null;
  programsVerificationSource?: string | null;
  aiEnrichmentStatus?: 'complete' | 'partial' | 'failed' | null;
  aiEnrichmentError?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);

  // --- DASHBOARD ---
  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${environment.apiUrl}/admin/stats`);
  }

  // --- ADMINISTRACIÓN DE USUARIOS ---
  getAllUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${environment.apiUrl}/users`);
  }

  createUser(data: {
    email: string;
    fullname: string;
    password: string;
    role: 'student' | 'admin';
    title?: string;
    isEmailVerified?: boolean;
  }): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${environment.apiUrl}/users`, data);
  }

  updateUser(id: string, data: Partial<AdminUser>): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${environment.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/users/${id}`);
  }

  /** Suspende (temporal), banea (permanente) o reactiva una cuenta. */
  setUserSuspension(
    id: string,
    payload: { action: SuspensionAction; durationDays?: number; reason?: string },
  ): Observable<AdminUser> {
    return this.http.patch<AdminUser>(
      `${environment.apiUrl}/users/${id}/suspension`,
      payload,
    );
  }

  // --- ADMINISTRACIÓN DEL TEST VOCACIONAL ---
  getAllQuestions(): Observable<AdminTestQuestion[]> {
    return this.http.get<AdminTestQuestion[]>(`${environment.apiUrl}/admin/questions`);
  }

  createQuestion(question: Partial<AdminTestQuestion>): Observable<AdminTestQuestion> {
    return this.http.post<AdminTestQuestion>(`${environment.apiUrl}/admin/questions`, question);
  }

  updateQuestion(id: string, question: Partial<AdminTestQuestion>): Observable<AdminTestQuestion> {
    return this.http.put<AdminTestQuestion>(`${environment.apiUrl}/admin/questions/${id}`, question);
  }

  deleteQuestion(id: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/admin/questions/${id}`);
  }

  // --- MONITOREO IA ---
  getAiLogsStats(): Observable<AiLogsStatsResponse> {
    return this.http.get<AiLogsStatsResponse>(`${environment.apiUrl}/admin/ai-logs`);
  }

  // --- ADMINISTRACIÓN DE SIMULADORES ---
  public getAdminSimulators(): Observable<AdminSimulator[]> {
    return this.http.get<AdminSimulator[]>(`${environment.apiUrl}/admin/career-simulators`);
  }

  public createSimulator(simulator: Partial<AdminSimulator>): Observable<AdminSimulator> {
    return this.http.post<AdminSimulator>(`${environment.apiUrl}/admin/career-simulators`, simulator);
  }

  public updateSimulator(id: string, simulator: Partial<AdminSimulator>): Observable<AdminSimulator> {
    return this.http.put<AdminSimulator>(`${environment.apiUrl}/admin/career-simulators/${id}`, simulator);
  }

  public deleteSimulator(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/career-simulators/${id}`);
  }

  // --- OPERACIÓN DEL SISTEMA ---
  getSystemOverview(): Observable<SystemOverview> {
    return this.http.get<SystemOverview>(`${environment.apiUrl}/admin/system/overview`);
  }

  clearOperationalCache(): Observable<{
    universityMatchCacheDeleted: number;
    expiredOtpCodesDeleted: number;
  }> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/system/cache`);
  }

  cleanupOrphanOptions(): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`${environment.apiUrl}/admin/system/orphan-options`);
  }

  // --- CATÁLOGOS A6/A7 ---
  getCatalogs(): Observable<AdminCatalogs> {
    return this.http.get<AdminCatalogs>(`${environment.apiUrl}/admin/careers-catalog`);
  }

  createVocation(data: Partial<VocationCatalogItem>): Observable<VocationCatalogItem> {
    return this.http.post<VocationCatalogItem>(`${environment.apiUrl}/admin/careers-catalog/vocations`, data);
  }

  updateVocation(id: string, data: Partial<VocationCatalogItem>): Observable<VocationCatalogItem> {
    return this.http.put<VocationCatalogItem>(`${environment.apiUrl}/admin/careers-catalog/vocations/${id}`, data);
  }

  deleteVocation(id: string): Observable<{ success: boolean }> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/careers-catalog/vocations/${id}`);
  }

  createCareer(data: Partial<CareerCatalogItem>): Observable<CareerCatalogItem> {
    return this.http.post<CareerCatalogItem>(`${environment.apiUrl}/admin/careers-catalog/careers`, data);
  }

  updateCareer(id: string, data: Partial<CareerCatalogItem>): Observable<CareerCatalogItem> {
    return this.http.put<CareerCatalogItem>(`${environment.apiUrl}/admin/careers-catalog/careers/${id}`, data);
  }

  deleteCareer(id: string): Observable<{ success: boolean }> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/careers-catalog/careers/${id}`);
  }

  updateAxisMeta(axis: SteamAxis, data: Partial<AxisMetaItem>): Observable<AxisMetaItem> {
    return this.http.put<AxisMetaItem>(`${environment.apiUrl}/admin/careers-catalog/axis-meta/${axis}`, data);
  }

  // --- ADMINISTRACIÓN DE UNIVERSIDADES (candidatas de A8) ---
  public getAdminUniversities(): Observable<AdminUniversity[]> {
    return this.http.get<AdminUniversity[]>(`${environment.apiUrl}/universities`);
  }

  public createUniversity(university: Partial<AdminUniversity>): Observable<AdminUniversity> {
    return this.http.post<AdminUniversity>(`${environment.apiUrl}/admin/universities`, university);
  }

  public updateUniversity(id: string, university: Partial<AdminUniversity>): Observable<AdminUniversity> {
    return this.http.put<AdminUniversity>(`${environment.apiUrl}/admin/universities/${id}`, university);
  }

  public deleteUniversity(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/admin/universities/${id}`);
  }

  /** Borra TODAS las universidades — para reiniciar el mapeo desde cero. */
  public deleteAllUniversities(): Observable<{ deleted: number }> {
    return this.http.delete<{ deleted: number }>(`${environment.apiUrl}/admin/universities/all`);
  }

  /** Descubrimiento automático (Google Places). Sin `states`: las 32 capitales + zonas metropolitanas grandes. */
  public discoverUniversities(states?: string[]): Observable<DiscoverUniversitiesResult> {
    return this.http.post<DiscoverUniversitiesResult>(`${environment.apiUrl}/admin/universities/discover`, { states });
  }

  /** Descubrimiento vía DENUE/INEGI (censo económico oficial). Requiere `states` (uno o más). */
  public discoverFromDenue(states: string[]): Observable<DiscoverUniversitiesResult> {
    return this.http.post<DiscoverUniversitiesResult>(`${environment.apiUrl}/admin/universities/discover-denue`, { states });
  }

  /** Borra retroactivamente nombres basura (oficinas de gobierno, sindicatos, etc.) ya guardados. */
  public cleanupJunkUniversities(): Observable<{ deleted: number; deletedNames: string[] }> {
    return this.http.post<{ deleted: number; deletedNames: string[] }>(`${environment.apiUrl}/admin/universities/cleanup-junk`, {});
  }

  /** Verifica y enriquece en paralelo hasta 12 universidades contra sus sitios oficiales, resolviendo el sitio con Places si falta. */
  public enrichUniversitiesWithAi(limit?: number, filter?: string): Observable<EnrichUniversitiesResult> {
    return this.http.post<EnrichUniversitiesResult>(`${environment.apiUrl}/admin/universities/enrich`, { limit, filter });
  }

  /** Exporta universidades (con id) para editar a mano. `filter` acota por nombre/dirección (ej. "Veracruz"). */
  public exportUniversities(filter?: string): Observable<AdminUniversity[]> {
    const query = filter ? `?filter=${encodeURIComponent(filter)}` : '';
    return this.http.get<AdminUniversity[]>(`${environment.apiUrl}/admin/universities/export${query}`);
  }

  /** Reimporta un JSON ya editado a mano: ACTUALIZA por id (no crea universidades nuevas). */
  public bulkUpdateUniversities(universities: Partial<AdminUniversity>[]): Observable<BulkUpdateResult> {
    return this.http.post<BulkUpdateResult>(`${environment.apiUrl}/admin/universities/bulk-update`, { universities });
  }
}

export interface DiscoverUniversitiesResult {
  totalFound: number;
  created: number;
  skippedExisting: number;
  failed: number;
  errors: { index: number; name?: string; error: string }[];
}

export interface EnrichUniversitiesResult {
  processed: number;
  enriched: number;
  skipped: number;
  failed: number;
  errors: { name: string; error: string }[];
}

export interface BulkUpdateResult {
  updated: number;
  failed: number;
  errors: { index: number; name?: string; error: string }[];
}
