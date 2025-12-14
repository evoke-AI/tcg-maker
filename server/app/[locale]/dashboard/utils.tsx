export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-red-50 text-red-700 border-red-200';
    case 'TEACHER': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'STUDENT': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export const getAssignmentTypeColor = (type: string) => {
  switch (type) {
    case 'ENGLISH': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'GENERAL': return 'bg-gray-50 text-gray-700 border-gray-200';
    default: return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}; 