const cookieToken = (user,res)=>{
    const token = user.getJwtToken();

    const options = {
        expiresIn: new Date(
            Date.now() + process.env.COOKIE_TOKEN*24*3600*1000
        ),
        httpOnly: true
    };

    user.password = undefined
    res.status(200).cookie('token',token,options).json({
        success: true,
        token,
        user
    });
}


module.exports = cookieToken