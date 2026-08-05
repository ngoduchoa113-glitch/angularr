import { RecipeModel } from './models';

export const MOCK_RECIPES: RecipeModel[] = [
    {
        id: 1,
        name: 'Spaghetti Carbonara',
        description: 'Món mì Ý truyền thống với trứng và thịt xông khói ngon vcl.',
        price: 65000,
        videoUrl: "",
        imgUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600',
        isFavorite: true,
        ingredients: [
            { name: 'Mì Spaghetti', quantity: 200, unit: 'g' },
            { name: 'Thịt má heo Guanciale', quantity: 100, unit: 'g' },
            { name: 'Lòng đỏ trứng', quantity: 4, unit: 'cái' },
            { name: 'Phô mai Pecorino Romano', quantity: 50, unit: 'g' },
            { name: 'Tiêu đen', quantity: 1, unit: 'thìa cà phê' },
        ],
    },
    {
        id: 2,
        name: 'Salad Caprese',
        description: 'Món salad Ý đơn giản và thanh mát ngon vcl.',
        price: 50000,
        videoUrl: "",
        imgUrl: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=600',
        isFavorite: false,
        ingredients: [
            { name: 'Cà chua', quantity: 4, unit: 'quả' },
            { name: 'Phô mai Mozzarella tươi', quantity: 200, unit: 'g' },
            { name: 'Lá húng quế tươi', quantity: 1, unit: 'nắm' },
            { name: 'Dầu ô liu nguyên chất', quantity: 2, unit: 'thìa canh' },
        ],
    },
    {
        id: 3,
        name: 'Pizza Margherita',
        description: 'Bánh pizza Ý truyền thống với sốt cà chua, phô mai Mozzarella và lá húng quế tươi ngon vcl.',
        price: 170000,
        videoUrl: "",
        imgUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
        isFavorite: true,
        ingredients: [
            { name: 'Đế bánh pizza', quantity: 1, unit: 'cái' },
            { name: 'Sốt cà chua', quantity: 100, unit: 'g' },
            { name: 'Phô mai Mozzarella', quantity: 150, unit: 'g' },
            { name: 'Lá húng quế', quantity: 8, unit: 'lá' }
        ]
    },
    {
        id: 4,
        name: 'Lasagna',
        description: 'Món mì đút lò nổi tiếng của Ý với nhiều lớp pasta, sốt bò và phô mai béo ngậy.',
        imgUrl: 'https://images.unsplash.com/photo-1619895092538-128341789043',
        price: 99000,
        videoUrl: "",
        isFavorite: true,
        ingredients: [
            { name: 'Lá mì Lasagna', quantity: 8, unit: 'lá' },
            { name: 'Thịt bò băm', quantity: 300, unit: 'g' },
            { name: 'Phô mai Mozzarella', quantity: 200, unit: 'g' },
            { name: 'Sốt cà chua', quantity: 250, unit: 'ml' }
        ]
    },
    {
        id: 5,
        name: 'Beef Wellington',
        description: 'Thăn bò bọc nấm và vỏ bánh ngàn lớp, món ăn trứ danh của ẩm thực Anh.',
        imgUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947',
        price: 250000,
        videoUrl: "",
        isFavorite: false,
        ingredients: [
            { name: 'Thăn bò', quantity: 250, unit: 'g' },
            { name: 'Nấm', quantity: 100, unit: 'g' },
            { name: 'Vỏ Puff Pastry', quantity: 1, unit: 'miếng' },
            { name: 'Trứng gà', quantity: 1, unit: 'quả' }
        ]
    },
    {
        id: 6,
        name: 'Mushroom Risotto',
        description: 'Cơm Ý nấu cùng nấm và phô mai Parmesan, mềm mịn và thơm béo.',
        imgUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601',
        isFavorite: true,
        videoUrl: "",
        price: 85000,
        ingredients: [
            { name: 'Gạo Arborio', quantity: 200, unit: 'g' },
            { name: 'Nấm', quantity: 150, unit: 'g' },
            { name: 'Phô mai Parmesan', quantity: 60, unit: 'g' },
            { name: 'Nước dùng gà', quantity: 500, unit: 'ml' }
        ]
    },
    {
        id: 7,
        name: 'Fish and Chips',
        description: 'Cá tuyết chiên giòn ăn kèm khoai tây chiên, món ăn biểu tượng của nước Anh.',
        imgUrl: 'https://images.immediate.co.uk/production/volatile/sites/30/2019/12/asian-stule-fish-chips-ddfc280.jpg?quality=90&webp=true&resize=430,390',
        price: 100000,
        videoUrl: "",
        isFavorite: false,
        ingredients: [
            { name: 'Phi lê cá tuyết', quantity: 250, unit: 'g' },
            { name: 'Khoai tây', quantity: 300, unit: 'g' },
            { name: 'Bột mì', quantity: 100, unit: 'g' },
            { name: 'Dầu ăn', quantity: 500, unit: 'ml' }
        ]
    },
    {
        id: 8,
        name: 'Butter Croissant',
        description: 'Bánh sừng bò Pháp với nhiều lớp bơ xốp giòn, dùng cho bữa sáng hoặc trà chiều.',
        imgUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
        price: 55000,
        videoUrl: "",
        isFavorite: true,
        ingredients: [
            { name: 'Bột mì', quantity: 250, unit: 'g' },
            { name: 'Bơ', quantity: 120, unit: 'g' },
            { name: 'Men nở', quantity: 7, unit: 'g' },
            { name: 'Sữa tươi', quantity: 150, unit: 'ml' }
        ]
    },
    {
        id: 9,
        name: 'Tình yêu của cô ấy',
        description: 'Bánh sừng bò Pháp với nhiều lớp bơ xốp giòn, dùng cho bữa sáng hoặc trà chiều.',
        imgUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
        price: 100000000000000,
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1",
        isFavorite: true,
        ingredients: [
            { name: 'Bột mì', quantity: 250, unit: 'g' },
            { name: 'Bơ', quantity: 120, unit: 'g' },
            { name: 'Men nở', quantity: 7, unit: 'g' },
            { name: 'Sữa tươi', quantity: 150, unit: 'ml' }
        ]
    },
];