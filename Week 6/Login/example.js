adminrouter.get('/dashboard', async (req, res) => {
    if (req.session.isAdmin) {
        try {
            const searchQuery = req.query.search || ''; // Get the search query from the request
            const users = await User.find({
                $or: [
                    { username: new RegExp(searchQuery, 'i') },
                    { firstname: new RegExp(searchQuery, 'i') },
                    { lastname: new RegExp(searchQuery, 'i') },
                ],
            });
            res.render('admin-dashboard', { users, searchQuery }); // Pass users and searchQuery to the template
        } catch (err) {
            console.error('Error fetching users:', err);
            res.redirect('/admin/login');
        }
    } else {
        res.redirect('/admin/login');
    }
});

// Admin Delete User Route
adminrouter.post('/delete-user/:id', async (req, res) => {
    if (req.session.isAdmin) {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.redirect('/admin/dashboard');
        } catch (err) {
            console.error('Error deleting user:', err);
            res.redirect('/admin/dashboard');
        }
    } else {
        res.redirect('/admin/login');
    }
});