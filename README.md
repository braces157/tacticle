# Tactile Gallery

Tactile Gallery la du an full-stack mo phong mot storefront va trang quan tri cho he thong ban ban phim co cao cap. Frontend duoc xay dung bang `Vite + React + TypeScript`, backend dung `Spring Boot`, du lieu duoc quan ly boi `SQL Server + Flyway`.

## Tong quan

Du an hien co:

- Trang chu, danh muc, tim kiem, chi tiet san pham, gio hang va checkout
- Dang nhap, dang ky, doi mat khau, quen mat khau, ho so ca nhan
- Lich su don hang va chi tiet don hang
- Khu vuc admin cho dashboard, don hang, khach hang, ton kho va san pham
- Seed data va tai khoan demo de chay local

## Cong nghe su dung

### Frontend

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`
- `Tailwind CSS 4`
- `Vitest` + Testing Library

### Backend

- `Java 21`
- `Spring Boot 3`
- `Spring Web`
- `Spring Data JPA`
- `Spring Security`
- `Flyway`
- `SQL Server`
- `JWT`

## Cau truc thu muc

```text
.
|-- src/                 # ung dung frontend
|-- backend/             # API Spring Boot
|-- component/           # asset va mockup giao dien
|-- docs/                # tai lieu bo sung
|-- products.json        # nguon du lieu san pham lon
|-- DESIGN.md            # dinh huong giao dien / design system
```

## Yeu cau moi truong

- `Node.js` 20+
- `npm`
- `Java 21`
- `Maven`
- `SQL Server` neu muon chay backend voi profile mac dinh `sqlserver`

## Chay du an local

### 1. Chay frontend

```bash
npm install
npm run dev
```

Frontend mac dinh chay tai `http://localhost:5173`.

Neu can doi API base URL, tao file `.env`:

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

### 2. Chay backend

```bash
cd backend
mvn spring-boot:run
```

Backend mac dinh chay tai `http://localhost:8081` va da dat default profile la `sqlserver`.

### 3. Cau hinh SQL Server

Backend doc cau hinh qua bien moi truong:

```bash
set DB_HOST=localhost
set DB_PORT=1433
set DB_NAME=WorshopV2
set DB_USERNAME=sa
set DB_PASSWORD=your_password
set JWT_SECRET=replace-with-a-long-random-secret
```

Sau do chay lai:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=sqlserver
```

## Tai khoan demo

- Customer: `member@tactile.gallery` / `quiet`
- Admin: `admin@tactile.gallery` / `quiet`

## Script quan trong

Tai root:

```bash
npm run dev
npm run build
npm run preview
npm run test
```

Tai `backend/`:

```bash
mvn spring-boot:run
mvn test
```

## Luu y

- Frontend goi API mac dinh den `http://localhost:8081/api`
- Backend co them tai lieu rieng tai `backend/README.md`
- Thu muc `dist/`, `node_modules/`, `backend/target/`, `run-logs/` la artifact sinh ra trong qua trinh local dev va da duoc dua vao `.gitignore`

## Huong phat trien tiep

- Them file `.env.example` va `backend/.env.example` de chia se cau hinh ro rang hon
- Bo sung CI cho `npm run test` va `mvn test`
- Tach huong dan deploy frontend/backend thanh tai lieu rieng
