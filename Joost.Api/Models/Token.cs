﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Joost.Api.Models
{
    public class Token
    {
        public int UserId { get; set; }
        public DateTime Time { get; set; }
    }
}