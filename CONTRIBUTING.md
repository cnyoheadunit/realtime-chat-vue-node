# 🤝 Contributing Guidelines

Terima kasih atas minat Anda untuk berkontribusi pada proyek Realtime Chat! Dokumen ini akan membantu Anda memahami cara berkontribusi dengan efektif.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)

---

## 📜 Code of Conduct

Proyek ini mengikuti [Code of Conduct](./CODE_OF_CONDUCT.md). Dengan berpartisipasi, Anda diharapkan menjunjung tinggi kode etik ini.

## 🚀 Getting Started

### Prerequisites

Pastikan Anda telah menginstall:
- Node.js (v16+)
- MySQL (v8.0+)
- Git

### Fork & Clone

1. **Fork repository ini**
2. **Clone fork Anda:**
```bash
git clone https://github.com/YOUR_USERNAME/realtime-chat-vue-node.git
cd realtime-chat-vue-node
```

3. **Add upstream remote:**
```bash
git remote add upstream https://github.com/cnyoheadunit/realtime-chat-vue-node.git
```

## 🛠️ Development Setup

1. **Install dependencies:**
```bash
npm run install:all
```

2. **Setup environment:**
```bash
npm run setup:env
```

3. **Configure database:**
```sql
CREATE DATABASE realtime_chat_dev;
```

4. **Update environment files dengan development settings**

5. **Start development servers:**
```bash
npm run dev
```

## 🔄 Making Changes

### Creating a Branch

Buat branch baru untuk setiap feature atau bugfix:
```bash
git checkout -b feature/your-feature-name
# atau
git checkout -b fix/your-bugfix-name
```

### Branch Naming Convention

- `feature/` - untuk feature baru
- `fix/` - untuk bug fixes
- `docs/` - untuk dokumentasi
- `refactor/` - untuk refactoring code
- `test/` - untuk testing improvements

Contoh:
- `feature/group-chat`
- `fix/socket-connection-issue`
- `docs/update-api-documentation`

## 📝 Pull Request Process

### Before Submitting

1. **Update dari upstream:**
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run tests:**
```bash
npm test
```

3. **Check code quality:**
```bash
npm run lint
```

4. **Build project:**
```bash
npm run build
```

### Creating Pull Request

1. **Push branch ke fork Anda:**
```bash
git push origin feature/your-feature-name
```

2. **Buat Pull Request di GitHub**

3. **Isi template PR dengan informasi:**
   - Deskripsi perubahan
   - Issues yang diselesaikan (jika ada)
   - Screenshots (untuk UI changes)
   - Testing steps

### PR Review Process

- Minimal 1 review dari maintainer
- All checks harus pass (tests, linting)
- No conflicts dengan main branch
- Documentation updated (jika perlu)

## 💻 Coding Standards

### JavaScript/Vue

- Gunakan ES6+ syntax
- Follow Vue 3 Composition API patterns
- Use meaningful variable names
- Add comments untuk logic yang kompleks

**Example:**
```javascript
// ✅ Good
const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

// ❌ Bad
const check = (id) => {
  return cu.has(id);
};
```

### CSS/Styling

- Gunakan CSS custom properties untuk theming
- Follow mobile-first responsive design
- Use semantic class names

**Example:**
```css
/* ✅ Good */
.chat-message-container {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
}

/* ❌ Bad */
.msg {
  padding: 16px;
  border-radius: 8px;
}
```

### File Organization

```
src/
├── components/          # Reusable components
│   ├── Chat/           # Feature-specific components
│   └── shared/         # Shared components
├── composables/        # Vue composables
├── stores/            # Pinia stores
├── services/          # API services
├── utils/             # Utility functions
└── types/             # TypeScript types (future)
```

## 📋 Commit Message Guidelines

Gunakan [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: feature baru
- `fix`: bug fix
- `docs`: dokumentasi
- `style`: formatting, missing semicolons, dll
- `refactor`: refactoring code
- `test`: adding tests
- `chore`: maintenance tasks

### Examples

```bash
feat(chat): add typing indicators
fix(auth): resolve JWT token expiration issue
docs(api): update authentication endpoints
style(frontend): format code with prettier
refactor(socket): improve error handling
test(backend): add unit tests for auth controller
chore(deps): update dependencies
```

## 🐛 Reporting Issues

### Bug Reports

Gunakan template bug report dan sertakan:
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Screenshots/logs jika memungkinkan

### Feature Requests

Gunakan template feature request dan jelaskan:
- Problem yang ingin diselesaikan
- Proposed solution
- Alternative solutions
- Additional context

## 🧪 Testing Guidelines

### Unit Tests

- Write tests untuk business logic
- Mock external dependencies
- Test edge cases

**Example:**
```javascript
describe('AuthController', () => {
  it('should register user with valid data', async () => {
    const result = await authController.register({
      username: 'testuser',
      password: 'password123'
    });
    
    expect(result.success).toBe(true);
    expect(result.data.user.username).toBe('testuser');
  });
});
```

### Integration Tests

- Test API endpoints
- Test Socket.IO events
- Test database interactions

### Manual Testing

Sebelum submit PR, test manual:
1. Register 2 users berbeda
2. Login di 2 browser berbeda
3. Test real-time messaging
4. Test responsive design
5. Test error scenarios

## 📚 Documentation

### Code Documentation

- JSDoc untuk functions dan classes
- Inline comments untuk complex logic
- README updates untuk new features

**Example:**
```javascript
/**
 * Sends a real-time message to specified user
 * @param {number} receiverId - Target user ID
 * @param {string} message - Message content
 * @param {string} messageType - Type of message (text, image, file)
 * @returns {Promise<Object>} Message object with metadata
 */
async function sendMessage(receiverId, message, messageType = 'text') {
  // Implementation
}
```

### API Documentation

Update `docs/API.md` jika menambah/mengubah endpoints.

## 🎯 Development Focus Areas

Kontribusi yang sangat diapresiasi:

### Frontend
- UI/UX improvements
- Performance optimizations  
- Mobile responsiveness
- Accessibility (a11y)
- Internationalization (i18n)

### Backend
- API optimizations
- Database query improvements
- Security enhancements
- Error handling
- Rate limiting improvements

### Features
- Group chat functionality
- File/image sharing
- Push notifications
- Message search
- User profiles
- Message reactions
- Voice messages

### DevOps
- Docker improvements
- CI/CD pipeline enhancements
- Monitoring and logging
- Performance testing
- Security auditing

## 🔒 Security

Jika menemukan security vulnerability:

1. **JANGAN** buat public issue
2. Email maintainer secara private
3. Berikan detail vulnerability
4. Tunggu response sebelum disclosure

## 🏆 Recognition

Contributors akan diakui di:
- CONTRIBUTORS.md file
- GitHub contributors graph
- Release notes (untuk significant contributions)

## ❓ Getting Help

Jika butuh bantuan:

1. **Documentation** - Check existing docs first
2. **Discussions** - Use GitHub Discussions untuk questions
3. **Discord** - Join development Discord server
4. **Email** - Contact maintainers untuk urgent issues

## 🙏 Thank You

Setiap kontribusi, besar atau kecil, sangat dihargai! Mari bersama-sama membangun aplikasi chat yang amazing! 

---

**Happy Contributing! 🚀**