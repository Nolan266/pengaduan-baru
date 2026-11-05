// Konstanta: kategori, survei, kamera CCTV, aset gambar/video, dan berita contoh.


export const THEME_KEY = 'aduan-mobile-theme';

export const CATEGORIES = ['Infrastruktur', 'Parkir Liar', 'Pendidikan', 'Kebersihan'];

export const CATEGORY_UI = [
  { name: 'Infrastruktur', icon: 'road', color: '#2563eb' },
  { name: 'Parkir Liar', icon: 'car', color: '#4f46e5' },
  { name: 'Pendidikan', icon: 'school', color: '#059669' },
  { name: 'Kebersihan', icon: 'trash', color: '#d97706' },
];

export const SURVEI = [
  { emoji: '😞', label: 'Tidak puas', skor: 1 },
  { emoji: '😐', label: 'Biasa saja', skor: 3 },
  { emoji: '😊', label: 'Puas', skor: 4 },
  { emoji: '🤩', label: 'Sangat puas', skor: 5 },
];

export const CAMERAS = [
  { id: 'CAM-01', name: 'Pasar Sentral', location: 'Area parkir pasar', online: true, condition: 'Padat', agency: 'Dishub' },
  { id: 'CAM-02', name: 'SDN 03 Melati', location: 'Gerbang sekolah', online: true, condition: 'Lancar', agency: 'Disdik' },
  { id: 'CAM-03', name: 'Taman Kota', location: 'Area fasilitas publik', online: false, condition: 'Koneksi terputus', agency: 'Diskominfo' },
  { id: 'CAM-04', name: 'Simpang Sudirman', location: 'Persimpangan utama', online: true, condition: 'Lancar', agency: 'Dishub' },
];

export const VIDEOS = {
  'CAM-01': require('../../assets/cam-01.mp4'), 'CAM-02': require('../../assets/cam-02.mp4'),
  'CAM-03': require('../../assets/cam-03.mp4'), 'CAM-04': require('../../assets/cam-04.mp4'),
};

export const POSTERS = {
  'CAM-01': require('../../assets/cam-01-poster.jpg'), 'CAM-02': require('../../assets/cam-02-poster.jpg'),
  'CAM-03': require('../../assets/cam-03-poster.jpg'), 'CAM-04': require('../../assets/cam-04-poster.jpg'),
};

export const AVATAR = require('../../assets/avatar.jpg');

export const NEWS = [
  { colors: ['#1e40af', '#2563eb'], icons: ['landmark', 'file-circle-check'], topic: 'PEMERINTAHAN · PELAYANAN',
    title: 'Layanan Administrasi Warga Lebih Mudah',
    text: 'Contoh program layanan terpadu: pengurusan dokumen, informasi persyaratan, dan konsultasi warga dalam satu tempat.',
    more: 'Warga dapat menyiapkan dokumen identitas dan mengecek persyaratan sebelum datang ke kantor pelayanan. Contoh program ini mengutamakan antrean tertib dan akses bagi lansia serta penyandang disabilitas.' },
  { colors: ['#065f46', '#0f766e'], icons: ['school', 'road'], topic: 'FASILITAS PUBLIK · PENDIDIKAN',
    title: 'Revitalisasi Sekolah & Akses Jalan',
    text: 'Contoh penataan ruang kelas, trotoar, dan zona parkir untuk membuat lingkungan sekolah lebih nyaman dan aman.',
    more: 'Perbaikan dilakukan bertahap dengan perhatian pada keselamatan siswa, penerangan jalan, serta jalur pejalan kaki. Warga dapat menyampaikan kerusakan fasilitas melalui kategori Pendidikan atau Infrastruktur.' },
  { colors: ['#5b21b6', '#4338ca'], icons: ['tree', 'recycle'], topic: 'LINGKUNGAN · RUANG PUBLIK',
    title: 'Taman Bersih, Ruang Publik Nyaman',
    text: 'Contoh program perawatan taman, pengangkutan sampah, dan penambahan tempat sampah terpilah di ruang publik.',
    more: 'Partisipasi warga membantu menjaga fasilitas bermain, bangku taman, dan saluran air. Gunakan kategori Kebersihan untuk menyampaikan sampah menumpuk, serta sertakan uraian dan lokasi yang jelas.' },
  { colors: ['#155e75', '#0369a1'], icons: ['id-card', 'users'], topic: 'PEMERINTAHAN · KEPENDUDUKAN',
    title: 'Layanan Kependudukan Jemput Bola',
    text: 'Contoh program pelayanan keliling untuk membantu warga mengurus dokumen kependudukan lebih dekat dengan tempat tinggal.',
    more: 'Pelayanan keliling dapat mencakup konsultasi persyaratan KTP, kartu keluarga, dan akta kelahiran. Jadwal dan persyaratan aktual perlu mengikuti pengumuman instansi setempat.' },
  { colors: ['#92400e', '#9a3412'], icons: ['chart-column', 'comments'], topic: 'PEMERINTAHAN · PARTISIPASI WARGA',
    title: 'Transparansi Pembangunan & Aspirasi Warga',
    text: 'Contoh penyampaian rencana pembangunan, penggunaan anggaran, dan capaian program melalui kanal informasi publik.',
    more: 'Warga dapat menyampaikan kebutuhan lingkungan melalui musyawarah perencanaan pembangunan atau kanal pengaduan. Seluruh isi slide ini merupakan contoh, bukan pengumuman resmi pemerintah tertentu.' },
];
