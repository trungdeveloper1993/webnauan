import { Recipe } from './types';

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    name: 'Phở Bò Hà Nội',
    thumbnail: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80',
    description: 'Món ăn quốc hồn quốc túy của Việt Nam với nước dùng ngọt thanh từ xương bò.',
    ingredients: [
      { name: 'Xương ống bò', amount: '1', unit: 'kg' },
      { name: 'Thịt bò chín (nạm, gầu)', amount: '500', unit: 'g' },
      { name: 'Bánh phở tươi', amount: '1', unit: 'kg' },
      { name: 'Hành tây, hành tím, gừng', amount: '100', unit: 'g' },
      { name: 'Quế, hồi, thảo quả', amount: '1', unit: 'bộ' },
      { name: 'Rau thơm (ngò gai, húng quế)', amount: '1', unit: 'bó' }
    ],
    method: 'Nấu nước dùng trong 8-10 tiếng, nướng gừng hành để tạo mùi thơm đặc trưng.',
    steps: [
      'Rửa sạch xương bò, chần qua nước sôi để khử mùi.',
      'Nướng hành tây, gừng, hành tím cho thơm rồi rửa sạch lớp cháy.',
      'Hầm xương với nước lạnh, cho các gia vị nướng vào.',
      'Rang thơm quế, hồi, thảo quả rồi cho vào túi lọc bỏ vào nồi nước dùng.',
      'Nêm nếm gia vị vừa ăn (nước mắm, muối, đường phèn).',
      'Thái thịt bò mỏng, trần phở, xếp thịt lên trên và chan nước dùng nóng hổi.'
    ],
    category: 'Món nước'
  },
  {
    id: '2',
    name: 'Bún Chả Hà Nội',
    thumbnail: 'https://images.unsplash.com/photo-1546039907-7fa05f864c02?w=800&q=80',
    description: 'Thịt nướng thơm lừng ăn kèm nước chấm chua ngọt và bún tươi.',
    ingredients: [
      { name: 'Thịt nạc vai băm', amount: '300', unit: 'g' },
      { name: 'Thịt ba chỉ thái miếng', amount: '300', unit: 'g' },
      { name: 'Bún tươi', amount: '1', unit: 'kg' },
      { name: 'Đu đủ xanh, cà rốt', amount: '1', unit: 'quả' },
      { name: 'Nước mắm, đường, dấm', amount: '1', unit: 'bộ' },
      { name: 'Rau sống (xà lách, tía tô)', amount: '1', unit: 'bó' }
    ],
    method: 'Thịt được ướp gia vị đậm đà và nướng trên than hoa.',
    steps: [
      'Ướp thịt băm và thịt miếng với hành khô, nước mắm, đường, nước hàng.',
      'Để thịt ngấm gia vị trong ít nhất 30 phút.',
      'Làm dưa góp từ đu đủ và cà rốt với muối và dấm.',
      'Pha nước chấm theo tỷ lệ mắm, đường, nước lọc, chanh tỏi ớt.',
      'Nướng thịt trên than hoa cho đến khi vàng đều và thơm lừng.',
      'Bày bún, rau sống và thịt nướng ra đĩa, ăn kèm nước chấm.'
    ],
    category: 'Món nướng'
  },
  {
    id: '3',
    name: 'Cơm Tấm Sườn Bì Chả',
    thumbnail: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=800&q=80',
    description: 'Đặc sản miền Nam với hạt cơm tấm dẻo thơm và sườn nướng mật ong.',
    ingredients: [
      { name: 'Gạo tấm', amount: '500', unit: 'g' },
      { name: 'Sườn cốt lết', amount: '3', unit: 'miếng' },
      { name: 'Thính, da heo (làm bì)', amount: '200', unit: 'g' },
      { name: 'Trứng gà, thịt băm (làm chả)', amount: '200', unit: 'g' },
      { name: 'Dưa leo, cà chua', amount: '1', unit: 'bộ' }
    ],
    method: 'Nấu cơm tấm bằng phương pháp hấp để hạt cơm tơi xốp.',
    steps: [
      'Ướp sườn với mật ong, dầu hào, hành tỏi băm.',
      'Nấu cơm tấm trong xửng hấp cho đến khi chín dẻo.',
      'Làm chả trứng bằng cách trộn thịt băm, mộc nhĩ, trứng rồi hấp chín.',
      'Trộn bì heo với thính gạo thơm.',
      'Nướng sườn trên lửa vừa cho đến khi chín vàng hai mặt.',
      'Trình bày cơm ra đĩa với sườn, bì, chả, đồ chua và nước mắm kẹo.'
    ],
    category: 'Món cơm'
  },
  {
    id: '4',
    name: 'Lẩu Thả Phan Thiết',
    thumbnail: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=800&q=80',
    description: 'Món lẩu đặc sản vùng biển với cá mai rạng rỡ và nhiều loại rau củ tươi mát.',
    ingredients: [
      { name: 'Cá mai tươi', amount: '500', unit: 'g' },
      { name: 'Bún tươi', amount: '500', unit: 'g' },
      { name: 'Trứng gà (chiên sợi)', amount: '2', unit: 'quả' },
      { name: 'Thịt ba chỉ (luộc thái sợi)', amount: '200', unit: 'g' },
      { name: 'Dưa leo, xoài non, khế', amount: '1', unit: 'bộ' },
      { name: 'Xương ống cá', amount: '500', unit: 'g' }
    ],
    method: 'Cá mai được tái trong nước chanh trước khi nhúng lẩu.',
    steps: [
      'Nấu nước dùng từ xương cá và tôm khô cho ngọt thanh.',
      'Lọc cá mai lấy fillet, ướp với nước cốt chanh và gừng.',
      'Chiên trứng vàng mỏng rồi thái sợi nhỏ.',
      'Thái sợi thịt ba chỉ luộc, dưa leo, xoài non.',
      'Bày biện các nguyên liệu quanh đĩa cá mai như cánh hoa.',
      'Khi ăn nhúng cá và rau vào nồi nước dùng đang sôi.'
    ],
    category: 'Món lẩu'
  }
];
