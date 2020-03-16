using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ATPrep.Models
{
    public class UserModel
    {

        public int ID { get; set; }

        public string UserID {get;set;}

        public string Password { get; set; }

        public string UserName { get; set; }

        public string Email { get; set; }
        public string UserImage { get; set; }
        public string Role { get; set; }
    }
}
