const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendDeleteEmail } = require('../emails/account');
const router = new express.Router();

router.post('/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        await user.save()    
        
        res.status(201).send({user, token});
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();

        await user.save();

        res.send({user, token});
    } catch (error){
        res.status(400).send(error);
    }
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });

        await req.user.save();

        res.send();
    } catch(error) {
        res.status(500).send();
    }
});

router.post('/users/logoutall', auth, async(req, res) => {
    try {
        req.user.tokens = [];

        await req.user.save();

        res.send();
    } catch(error) {
        res.status(500).send();
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user);
})

router.patch('/users/me', auth,  async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid updates'});
    }

    try {
        const user = req.user;
        updates.forEach((update) => user[update] = req.body[update]);
        await user.save();

        res.send(user);
    } catch(error) {
        res.status(400).send(error);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        sendDeleteEmail(req.user.email, req.user.name);
        await req.user.remove();
        res.send(req.user);
    } catch(error) {
        res.send(400).send(error);
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(png|jpg|jpeg)$/)){
            return cb(new Error('Please upload an image file'));
        }

        cb(undefined, true);
    }
});
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message });
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();

    res.send();
})

router.get('/users/:id/avatar', async (req, res) => {
    try{
        const user = await User.findById(req.params.id);

        if(!user || !user.avatar){
            throw new Error();
        }

        res.set('Content-Type', 'image/jpg').send(user.avatar);
    } catch(error){
        res.status(404).send();
    }
})

module.exports = router;