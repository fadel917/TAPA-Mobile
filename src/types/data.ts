// src/types/data.ts

export type Property = {
  id: string;
  judul_iklan: string;
  harga: number;
  kecamatan: string;
  luas_tanah: number;
  url_foto: string[];
  alamat_lengkap: string;
  // Tambahkan field baru di bawah ini
  harga_per_meter?: number; // Tanda tanya (?) berarti field ini opsional
  harga_pajak_tanah?: number;
  status_pajak_tanah?: string;
  koordinat_latitude?: string;
  koordinat_longitude?: string;
  kontur_tanah?: string;
  deskripsi_iklan?: string;
  url_visual_3d?: string;
  // Tambahkan field lain dari Firestore Anda jika perlu
};