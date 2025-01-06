const Address = require("../../models/addressSchema");
const User = require("../../models/userSchema");

const getAddAddress = async (req, res) => {
    try {
        let user = null;
        let userId=req.session.user
        // Check if userId is available and fetch user
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.redirect("/login");
            }
        }

        res.render('add-Address', {
            currentPage: 'profile',
            user,
        });
    } catch (error) {
        res.redirect('/pageNotFound');
    }
}

const postaddAddress = async (req, res) => {
    try {
        // Destructure the address data from the request body
        const { firstName, lastName, landmark, addressDetail,city,state, zip, phone, altPhone } = req.body;

        // Validate required fields (add more validation as needed)
        if (!firstName || !lastName || !landmark || !addressDetail || !state || !zip || !phone) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Create a new address document
        const newAddress = new Address({
            userId: req.session.user, 
            address: [{
                addressType: 'home', 
                name: `${firstName} ${lastName}`, 
                city: city, 
                landMark: landmark,
                addressDetail, 
                state,
                pincode: zip,
                phone,
                altPhone: altPhone || '',
            }]
        });

        
        await newAddress.save();

        
        res.status(201).json({
            message: 'Address added successfully.',
            address: newAddress
        });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ message: 'Server error while adding address.' });
    }
};

const getEditAddress = async (req, res) => {
    const addressId = req.params.id; 
  
    try {
      const address = await Address.findById(addressId); 
      if (!address) {
        return res.status(404).send({ message: 'Address not found.' });
      }
  
      let user = null;
        let userId=req.session.user
        // Check if userId is available and fetch user
        if (userId) {
            user = await User.findById(userId);
            if (!user) {
                return res.redirect("/login");
            }
        }
      res.render('edit-address', { address,
            currentPage: 'profile',
            user,
       });
    } catch (error) {
      res.status(500).send({ message: 'Error retrieving address details.' });
    }
  };

  const postEditAddress = async (req, res) => {
    const addressId = req.params.id; 
    console.log(req.body)
    const {
        firstName,
        lastName,
        landmark,
        addressDetail,
        state,
        city,
        zip,
        phone,
        altPhone,
    } = req.body; // Destructure the data from the request body
    
    try {
        // Find the address by ID
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).send({ message: 'Address not found.' });
        }

        // Update the address fields
        const fullName = `${firstName} ${lastName}`;
        address.address[0].name = fullName;
        address.address[0].landMark = landmark;
        address.address[0].addressDetail = addressDetail;
        address.address[0].city = city;
        address.address[0].state = state;
        address.address[0].pincode = zip;
        address.address[0].phone = phone;
        address.address[0].altPhone = altPhone;

        console.log(address.address[0].city)
        // Save the updated address
        await address.save();

        // Respond with success message
        return res.status(200).send({ message: 'Address updated successfully!' });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).send({ message: 'Error updating address.' });
    }
};

const deleteAddress = async (req, res) => {
    const addressId = req.params.id; 

    try {
        
        const result = await Address.findByIdAndDelete(addressId);
        if (!result) {
            return res.status(404).send({ message: 'Address not found.' });
        }

      
        return res.status(200).send({ message: 'Address deleted successfully!' });
    } catch (error) {
        console.error(error); 
        return res.status(500).send({ message: 'Error deleting address.' });
    }
};



module.exports={
    getAddAddress,
    postaddAddress,
    getEditAddress,
    postEditAddress,
    deleteAddress,

}