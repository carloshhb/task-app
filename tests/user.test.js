const request = require('supertest')
const app = require('../src/app')
const {userOne, userOneId, setupDatabase, User} = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should signup a new user', async () => {
    const response = await request(app).post('/users')
        .send({
            name: 'New user',
            password: 'newpass123',
            email: 'email@email.com'
    }).expect(201)
    
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    expect(response.body).toMatchObject({
        user: {
            name: 'New user',
            email: 'email@email.com'
        },
        token: user.tokens[0].token
    })

    expect(user.password).not.toBe('newpass123')
})

test('Should login user', async() => {
    const response = await request(app).post('/users/login')
        .send({
            email: 'newmail@email.com',
            password: 'minhasenha12345'
    }).expect(200)
    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)

})

test('Should fail to login user', async() => {
    await request(app).post('/users/login')
        .send({
            email: 'newmail@email.com',
            password: 'minhasenha'
        }).expect(400)
})

test('Pegar perfil do usuario', async () => {
    await request(app).get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app)
        .get('/users/me')
        .send()
        .expect(401)
})

test('Should upload profile avatar', async() => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/profile-pic.jpg')
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update user profile', async() => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: 'Jess'
        })
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toEqual('Jess')
})

test('Should not update user profile', async() => {
    await request(app)
        .patch('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: 'Natal'
        })
        .expect(400)
})

test('Should delete profile for authenticated user', async() => {
    await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
    
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete profile for unauthenticated user', async() => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})