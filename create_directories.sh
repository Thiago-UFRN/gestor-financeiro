# ----- ESTRUTURA DA PASTA 'app' (ROTAS, PÁGINAS E API) -----

# Cria os grupos de rota e as páginas principais
mkdir -p app/'(auth)'/login
mkdir -p app/'(main)'/dashboard
mkdir -p app/'(main)'/despesas
mkdir -p app/'(main)'/rendas
mkdir -p app/'(main)'/reservas
mkdir -p app/'(main)'/admin/usuarios

# Cria os arquivos de página (page.jsx) e layout para o grupo principal
touch app/'(auth)'/login/page.jsx
touch app/'(main)'/layout.jsx
touch app/'(main)'/dashboard/page.jsx
touch app/'(main)'/despesas/page.jsx
touch app/'(main)'/rendas/page.jsx
touch app/'(main)'/reservas/page.jsx
touch app/'(main)'/admin/usuarios/page.jsx

# Cria a estrutura da API
mkdir -p app/api/auth/login
mkdir -p app/api/auth/register
mkdir -p app/api/despesas
mkdir -p app/api/rendas
mkdir -p app/api/reservas
mkdir -p app/api/usuarios

# Cria os arquivos de rota da API (route.js)
touch app/api/auth/login/route.js
touch app/api/auth/register/route.js
touch app/api/despesas/route.js
touch app/api/rendas/route.js
touch app/api/reservas/route.js
touch app/api/usuarios/route.js


# ----- ESTRUTURA DE PASTAS ADICIONAIS NA RAIZ -----

# Cria a pasta de componentes e suas subpastas
mkdir -p components/ui
mkdir -p components/charts
mkdir -p components/forms

# Cria alguns arquivos de componentes de exemplo
touch components/Navbar.jsx
touch components/Sidebar.jsx
touch components/forms/ExpenseForm.jsx
touch components/forms/IncomeForm.jsx
touch components/charts/PieChart.jsx
touch components/charts/BarChart.jsx

# Cria a pasta de bibliotecas/utilitários
mkdir -p lib

# Cria os arquivos de configuração e utilitários
touch lib/dbConnect.js
touch lib/auth.js
touch lib/utils.js

# Cria a pasta para os modelos do Mongoose
mkdir -p models

# Cria os arquivos de modelo
touch models/User.js
touch models/Income.js
touch models/Expense.js
touch models/Savings.js

# Cria o arquivo de variáveis de ambiente local
# E já adiciona um comentário para lembrar você de preenchê-lo
echo "# Cole aqui a sua MONGODB_URI do MongoDB Atlas\nMONGODB_URI=\n\n# Crie uma chave secreta segura para o JWT\nJWT_SECRET=" > .env.local

# Mensagem de conclusão
echo "\n✅ Estrutura de pastas e arquivos criada com sucesso!"
echo "➡️  O próximo passo é preencher o arquivo '.env.local' e começar a codificar os arquivos, começando pelo 'lib/dbConnect.js'."
