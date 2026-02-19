export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDateShort = (date: string | Date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getRoleName = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'Administrator';
    case 'DRIVER':
      return 'Driver';
    case 'EMPLOYEE':
      return 'Karyawan';
    default:
      return role;
  }
};
