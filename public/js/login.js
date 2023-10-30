import { response } from "express"

const urlBase = 'http://localhost:4000/api'

//monitorando o submit do formulário
documento.getElementBuId('loginForm').addEventListener('submit', function(event){
    event.preventDefoult() //evita o recarregamento do form
    //obtendo valores do form
    const login = document.getElementById('login').value 
    const senha = dpcument.getElementBuId('senha').value
    //Criando o objeto para autenticar
    const dadosLogin = {
        email: login,
        senha: senha
    }
    //Efetuando o post para a API REST
    fetch(`$${urlBase}/usuarios/login`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosLogin)
    })
    .then(response => response.json())
    .then(data => {
        if(data.access_token){
            //armazenamos no localstorage
            localStorage.setItem('token', data.access_token)
            window.location.href='menu.html'
        }else if (data.erros) { //possui algu erro?
        const erroMessages = data.erros.map(error => error.msg).join('\n')
        alert('Falha ao efetuar o login:\n'+erroMessages)
        }else{
            alert('Não foi possível efetuar o login no servidor')
        }
    })
    .catch( erro =>{
        console.error(`Erro no Login: ${error}`)

    })
})
