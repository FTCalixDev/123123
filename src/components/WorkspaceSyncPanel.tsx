import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  HardDrive,
  Cloud,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Database,
  LogOut,
  Plus,
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  getAccessToken,
  logoutGoogle,
  syncOrderToFirestore,
  recordWorkspaceSyncLog,
  fetchMySyncedOrders,
} from '../lib/firebase';
import { Order, Employee } from '../types/restaurant';
import { User } from 'firebase/auth';

interface WorkspaceSyncPanelProps {
  orders: Order[];
  employees: Employee[];
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export const WorkspaceSyncPanel: React.FC<WorkspaceSyncPanelProps> = ({
  orders,
  employees,
}) => {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [firestoreCount, setFirestoreCount] = useState<number>(0);

  // Explicit user confirmation dialog state for destructive/mutating operations
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    const unsub = initAuth(
      (user) => {
        setGoogleUser(user);
        setNeedsAuth(false);
        loadDriveFiles();
        loadFirestoreOrders();
      },
      () => {
        setGoogleUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setNeedsAuth(false);
        await loadDriveFiles();
        await loadFirestoreOrders();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setNeedsAuth(true);
    setDriveFiles([]);
  };

  const loadFirestoreOrders = async () => {
    try {
      const list = await fetchMySyncedOrders();
      setFirestoreCount(list.length);
    } catch (e) {
      console.error(e);
    }
  };

  const loadDriveFiles = async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?pageSize=12&fields=files(id,name,mimeType,webViewLink,modifiedTime)&orderBy=modifiedTime desc",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 401) {
        setNeedsAuth(true);
        return;
      }
      const data = await res.json();
      if (data.files) {
        setDriveFiles(data.files);
        const firstSheet = data.files.find(
          (f: DriveFile) => f.mimeType === 'application/vnd.google-apps.spreadsheet'
        );
        if (firstSheet && !selectedSpreadsheetId) {
          setSelectedSpreadsheetId(firstSheet.id);
        }
      }
    } catch (e: any) {
      setErrorMsg('Error al consultar archivos de Google Drive.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new Google Spreadsheet with Orders & Payroll report
  const handleCreateSpreadsheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `Brasa & Lúpulo - Reporte Pedidos (${new Date().toLocaleDateString()})`,
          },
        }),
      });
      const sheetData = await createRes.json();
      if (!createRes.ok || !sheetData.spreadsheetId) {
        throw new Error(sheetData.error?.message || 'No se pudo crear la hoja de cálculo');
      }

      const newId = sheetData.spreadsheetId;
      const firstSheetTitle =
        sheetData.sheets?.[0]?.properties?.title || 'Sheet1';

      // Populate rows
      const values = [
        ['ID Pedido', 'Número', 'Tipo', 'Cliente', 'Estado', 'Repartidor', 'Total ($U)', 'Fecha'],
        ...orders.map((o) => [
          o.id,
          o.orderNumber,
          o.type,
          o.customer.name,
          o.status,
          o.assignedToName || 'Sin asignar',
          o.total,
          o.createdAt,
        ]),
      ];

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${newId}/values/${encodeURIComponent(
          `${firstSheetTitle}!A1`
        )}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        }
      );

      await recordWorkspaceSyncLog('CREATE_SPREADSHEET', newId);
      setSelectedSpreadsheetId(newId);
      setStatusMsg(`¡Planilla creada y sincronizada en Google Sheets con ${orders.length} pedidos!`);
      await loadDriveFiles();
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al crear la planilla en Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  // Update existing spreadsheet (Requires Explicit User Confirmation Modal!)
  const requestUpdateSpreadsheet = () => {
    if (!selectedSpreadsheetId) return;
    const targetFile = driveFiles.find((f) => f.id === selectedSpreadsheetId);
    setConfirmModal({
      title: '¿Confirmar actualización de Google Sheets?',
      description: `Se sobrescribirán las filas de la hoja principal en "${
        targetFile?.name || selectedSpreadsheetId
      }" con los ${orders.length} pedidos actuales del restaurante.`,
      confirmLabel: 'Sí, Actualizar Planilla',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) {
          setNeedsAuth(true);
          return;
        }
        setLoading(true);
        setErrorMsg(null);
        setStatusMsg(null);
        try {
          // Fetch metadata first to get actual first sheet tab name
          const metaRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${selectedSpreadsheetId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const meta = await metaRes.json();
          const tabName = meta.sheets?.[0]?.properties?.title || 'Sheet1';

          const values = [
            ['ID Pedido', 'Número', 'Tipo', 'Cliente', 'Estado', 'Repartidor', 'Total ($U)', 'Fecha'],
            ...orders.map((o) => [
              o.id,
              o.orderNumber,
              o.type,
              o.customer.name,
              o.status,
              o.assignedToName || 'Sin asignar',
              o.total,
              o.createdAt,
            ]),
          ];

          const updateRes = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${selectedSpreadsheetId}/values/${encodeURIComponent(
              `${tabName}!A1`
            )}?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ values }),
            }
          );

          if (!updateRes.ok) {
            throw new Error('Error al escribir datos en la hoja de cálculo seleccionada.');
          }

          await recordWorkspaceSyncLog('UPDATE_SPREADSHEET', selectedSpreadsheetId);
          setStatusMsg(`¡Planilla "${targetFile?.name || selectedSpreadsheetId}" actualizada con éxito!`);
        } catch (err: any) {
          setErrorMsg(err.message || 'Error al actualizar Google Sheets');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Delete file from Google Drive (Requires Explicit User Confirmation Modal!)
  const requestDeleteDriveFile = (file: DriveFile) => {
    setConfirmModal({
      title: `¿Eliminar "${file.name}" de Google Drive?`,
      description: `Estás por eliminar permanentemente el archivo "${file.name}" de tu cuenta de Google Drive. Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, Eliminar Archivo',
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) {
          setNeedsAuth(true);
          return;
        }
        setLoading(true);
        try {
          const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            throw new Error('No se pudo eliminar el archivo de Google Drive.');
          }
          await recordWorkspaceSyncLog('DELETE_DRIVE_FILE', file.id);
          setStatusMsg(`Archivo "${file.name}" eliminado de Google Drive.`);
          await loadDriveFiles();
        } catch (e: any) {
          setErrorMsg(e.message || 'Error al eliminar archivo.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Sync all orders to Cloud Firestore
  const handleSyncFirestore = async () => {
    if (!googleUser) {
      setNeedsAuth(true);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      for (const o of orders) {
        await syncOrderToFirestore({
          id: o.id,
          orderNumber: o.orderNumber,
          type: o.type,
          status: o.status,
          total: o.total,
        });
      }
      await loadFirestoreOrders();
      setStatusMsg(`¡${orders.length} pedidos respaldados en Firebase Firestore bajo reglas Zero-Trust!`);
    } catch (e: any) {
      setErrorMsg('Error al sincronizar con Firestore: verifica tus permisos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Cloud className="w-5 h-5 text-amber-400" />
            <span>Google Workspace (Sheets & Drive) + Firebase Cloud</span>
          </h2>
          <p className="text-xs text-stone-400">
            Exporta comandas y liquidaciones de sueldos a Google Sheets, administra respaldos en Drive y sincroniza en Firestore.
          </p>
        </div>

        {googleUser && !needsAuth && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-400 font-bold">
              Conectado: {googleUser.email}
            </span>
            <button
              onClick={handleGoogleLogout}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-rose-500/20 text-stone-300 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Desconectar Google</span>
            </button>
          </div>
        )}
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {needsAuth ? (
        <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 text-center space-y-4">
          <FileSpreadsheet className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white uppercase">
            Conecta tu cuenta de Google Workspace
          </h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Inicia sesión con Google para exportar los pedidos de Brasa & Lúpulo a hojas de cálculo de Google Sheets, gestionar archivos en Google Drive y respaldar en Firebase Firestore.
          </p>

          <div className="flex justify-center pt-2">
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="gsi-material-button inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper flex items-center gap-2.5">
                <div className="gsi-material-button-icon w-5 h-5">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block', width: '20px', height: '20px' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoggingIn ? 'Conectando...' : 'Sign in with Google'}
                </span>
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Google Sheets & Firestore Actions */}
          <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
            <h3 className="text-sm font-bold uppercase text-amber-400 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportación a Google Sheets & Firestore</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={handleCreateSpreadsheet}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nueva Planilla Google Sheets con Pedidos ({orders.length})</span>
              </button>

              {selectedSpreadsheetId && (
                <button
                  onClick={requestUpdateSpreadsheet}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sobrescribir Planilla Seleccionada (Con Confirmación)</span>
                </button>
              )}

              <button
                onClick={handleSyncFirestore}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Sincronizar en Firebase Firestore ({firestoreCount} en nube)</span>
              </button>
            </div>
          </div>

          {/* Google Drive File Browser */}
          <div className="p-5 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase text-amber-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span>Archivos en Google Drive ({driveFiles.length})</span>
              </h3>
              <button
                onClick={loadDriveFiles}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300"
                title="Actualizar archivos de Drive"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {driveFiles.length === 0 ? (
                <p className="text-xs text-stone-500 py-4 text-center">
                  No se encontraron archivos recientes en Drive.
                </p>
              ) : (
                driveFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() =>
                      file.mimeType.includes('spreadsheet') && setSelectedSpreadsheetId(file.id)
                    }
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      selectedSpreadsheetId === file.id
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-bold truncate">{file.name}</div>
                      <div className="text-[10px] text-stone-500 truncate">{file.mimeType}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400"
                          title="Abrir en Google Drive / Sheets"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          requestDeleteDriveFile(file);
                        }}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-rose-600 text-stone-400 hover:text-white"
                        title="Eliminar de Google Drive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Explicit Confirmation Modal for Mutating/Destructive Workspace Actions */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-amber-500/50 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm uppercase">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{confirmModal.title}</span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              {confirmModal.description}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal(null);
                  await action();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg"
              >
                {confirmModal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
