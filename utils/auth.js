const crypto = require('crypto')

// 生成密钥对
// const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
//   modulusLength: 2048,
//   publicKeyEncoding: {
//     type: 'pkcs1',
//     format: 'pem',
//   },
//   privateKeyEncoding: {
//     type: 'pkcs1',
//     format: 'pem',
//   },
// })
// console.log('publicKey, privateKey', publicKey, privateKey)
// 可以动态生成密钥对 但是目前不需要
// 前端直接写死公匙
const publicKey = `-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEAyp05rWcAFb/KFO3ea3kff0QYP75onHndocdv/Rg1DpXMS6WrKbHi
9kWrVAG0hfjx46FA+jnQqdIVHaBBPgSXBrqw6+K4cEqlFvjqEn/gI+p8eg3JbWn2
BvsAzqahkEhqIq0vxzinsjkIJ0Guc7E0PFHyxMxhIDHNcynOpRvkuHx3dslHPTS6
NB3Exp48XRaqkvoIyK/KLctpDok3NO79KrYLq68VqCT9v0eoTvKSFTvdhxbACS8g
RLDifGfA0LLnqBeoEHpPZSDsvmFblF8MGNJNr18hQSQPakJpKjGDCzhT6hO1x1u+
G6vK4NowQ76ey9zO9zhOd3CvE3QCitv6SwIDAQAB
-----END RSA PUBLIC KEY-----`
const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAyp05rWcAFb/KFO3ea3kff0QYP75onHndocdv/Rg1DpXMS6Wr
KbHi9kWrVAG0hfjx46FA+jnQqdIVHaBBPgSXBrqw6+K4cEqlFvjqEn/gI+p8eg3J
bWn2BvsAzqahkEhqIq0vxzinsjkIJ0Guc7E0PFHyxMxhIDHNcynOpRvkuHx3dslH
PTS6NB3Exp48XRaqkvoIyK/KLctpDok3NO79KrYLq68VqCT9v0eoTvKSFTvdhxbA
CS8gRLDifGfA0LLnqBeoEHpPZSDsvmFblF8MGNJNr18hQSQPakJpKjGDCzhT6hO1
x1u+G6vK4NowQ76ey9zO9zhOd3CvE3QCitv6SwIDAQABAoIBAAoGzXe5IlDGjMO2
tmw0x8FpXMEsH+Anywx6TUlF5+ZAtSXvMluzW7XFN9fF59Q+FWD8Ngt2o06sFfMW
iZ6oj9K7mA1sSvqfmbDb1jWJJ3iPiOO/XT7xYJqdfuo7ERa4nAFQTGN8TcGCP1bg
p2HpRy+kUd0O93rQ4XJirhZknXp1nmFQWAbzq60l0Na+igGF0z5ufyeWWbZdmwFU
X+x+0BhAynYgdaS7QMW1F4prhytdGUVF1k298Ja2ujnx7+HhlnVlUO3K3mTk053m
c8T684lMFTJqwlaI13FXWceEgTmcwAR1Z94Q/Ma4401GDGQHywY6Bw182dAgw1v7
DqGGb4ECgYEA+wVnjoBEfPgLQmhaV69edk44Shx/TJ3TVxtNWuL23w7D41T9LMzu
fHQtLhPmbpgXYrXqMInAmdDmg2Ftb3/4p/DQprTTi/7lGllejrfVX+kTCeZvr++I
JJ1LBR+BqNBdftk5OHFn9XyzzF+uRmcLlkxjuv6mK00glwFPFXHS4csCgYEAzqIH
EF9K4trj+l8NEPF1kzG25cdDh5it7xDezWYGwMNZpqeVXcihwFpBrO6y0P84Pg9u
qaiXIzf43nriYzi/Ky5Q9wkFscas0RZfdO7YstZAY9viG9knJcOTg9zvSLd+1hNV
NUUmicxerH3Gpys2Uwz5LlIrf3SSXHLwRH+2OYECgYEAoek6go/5nSHhIVRt8WEM
bQLHDAaVlbW3O9hAbP84fWfoshl/tAX7TgshmTb8yxkO/HyaMfSoZo54IQYWsHS6
zphl/SFl0kb3P6eldijdWJ/dx+T65WB7UCKk4QkRePHtXISAhAeiJpXo40pT/tU4
hBmBunvGcuesvbn6aLqia0ECgYBQ+fhQtzdurZ9YF/XT5PxRodLuO2fAdNn87RyT
W99bnXK9t8D2TtDsw7InJigXdV1CHOQeQr5wA9hYv8mGXs+0CWObXALKR3SkP+NK
vOtZMlNrjtkOVsxbpUhjDasMUTS4ij0DMkVHDTsw192I14tjgpsIRxVazoEpD7YO
8gmkgQKBgCAp2cr+yLST0Piw8FaOyt2di+40Y1kkMmwKgX6+oCZkgn9zu3VufqAe
bBOJhM5MbYsx9IwNTduGlxZ4yqlNafSMPKqF1CKGIMpY1xNuaw3diFyoy9D6dsFR
Aeue+GZnqFvsUY9VW5+ocNfWwpKBQZE5tlKTvVdjfsZ36eiWO2uG
-----END RSA PRIVATE KEY-----`

// 加密函数
function encrypt(text) {
  const encryptedBuffer = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(text, 'utf8'),
  )
  return encryptedBuffer.toString('base64')
}
// 解密函数
function decrypt(encryptedText) {
  const decryptedBuffer = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(encryptedText, 'base64'),
  )
  return decryptedBuffer.toString('utf8')
}
const salt = 'vue3-admin'
// 加密 哈希函数 (不可逆) 模拟前端
function encryptHash(text) {
  const hash = crypto.createHash('sha256')
  hash.update(text)
  return hash.digest('hex')
}
// 加盐 哈希函数 后端加盐加密
function hashWithSalt(text) {
  const hash = crypto.createHash('sha256')
  hash.update(text + salt)
  return hash.digest('hex')
}

/**
 * 思考
 * 1、如果通过写死的密匙对加密解密 那么如拿到加密后的密码直接请求 那么直接可以登录  加密没有意义感觉
 * 2、如果是2次不可逆加密 这样是可以  但会后端不可能知道原始密码  只能走忘记密码接口
 * 3、如果沿用第一种加密  后端解密后再进行不可逆加密 这样的话前端是密文传输 数据库也是密文  但是这样的也是不可能知道原始密码  那样还不如直接使用2
 */

/**
 * @method 获取客户端IP地址
 * @param {string} req 传入请求HttpRequest
 * 客户请求的IP地址存在于request对象当中
 * express框架可以直接通过 req.ip 获取
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress || ''
}
const https = require('https')
// 获取公网ip https://api.ipify.org/?format=json
function getIp() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://api.ipify.org/?format=json', res => {
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const ip = JSON.parse(data).ip
          resolve(ip)
        } catch (error) {
          reject(error) // JSON 解析失败时 reject 错误
        }
      })
    })

    req.on('error', error => {
      reject(error) // 请求错误时 reject 错误
    })
  })
}
module.exports = {
  encrypt,
  decrypt,
  encryptHash,
  hashWithSalt,
  getClientIp,
  getIp,
}
