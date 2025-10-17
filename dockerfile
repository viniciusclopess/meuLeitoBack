# Escolha uma imagem base
FROM node:22

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie os arquivos do projeto para dentro do contêiner
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o restante dos arquivos do projeto para dentro do contêiner
COPY . .

# Exponha a porta em que a aplicação vai rodar
EXPOSE 3500

# Comando para rodar a aplicação
CMD ["npm", "run", "dev"]
