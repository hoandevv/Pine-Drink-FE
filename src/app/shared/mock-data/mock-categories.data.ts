export interface MockCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
  description: string;
  isActive: boolean;
}

export const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: 'cat-001',
    name: 'Trà sữa',
    icon: 'local_cafe',
    count: 18,
    color: 'linear-gradient(135deg, #FFD64F 0%, #FFC928 100%)',
    description: 'Trà sữa truyền thống và hiện đại với nhiều hương vị',
    isActive: true
  },
  {
    id: 'cat-002',
    name: 'Trà trái cây',
    icon: 'local_bar',
    count: 14,
    color: 'linear-gradient(135deg, #8ee6a8 0%, #22c55e 100%)',
    description: 'Trà trái cây tươi mát, thanh nhiệt giải khát',
    isActive: true
  },
  {
    id: 'cat-003',
    name: 'Cafe',
    icon: 'coffee',
    count: 9,
    color: 'linear-gradient(135deg, #D99A16 0%, #B8860B 100%)',
    description: 'Cafe nguyên chất rang xay từ hạt Robusta và Arabica',
    isActive: true
  },
  {
    id: 'cat-004',
    name: 'Đá xay',
    icon: 'icecream',
    count: 11,
    color: 'linear-gradient(135deg, #DFF3D4 0%, #B7D7A8 100%)',
    description: 'Đồ uống đá xay mát lạnh, thơm ngon',
    isActive: true
  },
  {
    id: 'cat-005',
    name: 'Matcha',
    icon: 'eco',
    count: 8,
    color: 'linear-gradient(135deg, #2F6B46 0%, #164A2F 100%)',
    description: 'Matcha Nhật Bản cao cấp, đậm vị và bổ dưỡng',
    isActive: true
  },
  {
    id: 'cat-006',
    name: 'Topping',
    icon: 'add_circle',
    count: 16,
    color: 'linear-gradient(135deg, #FFEBA3 0%, #FFD64F 100%)',
    description: 'Topping đa dạng để tùy chỉnh đồ uống',
    isActive: true
  }
];
