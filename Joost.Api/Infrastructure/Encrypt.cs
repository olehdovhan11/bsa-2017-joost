﻿using Joost.Api.Models;
using Newtonsoft.Json;
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace Joost.Api.Infrastructure
{
    public static class Encrypt
    {
        // This size of the IV (in bytes) must = (keysize / 8).  Default keysize is 256, so the IV must be
        // 32 bytes long.  Using a 16 character string here gives us 32 bytes when converted to a byte array.
        private const string initVector = "sfl5)prt49(fhi2:";
        private const string passPhrase = "VQHA7nwMrCMKfEhp";

        // This constant is used to determine the keysize of the encryption algorithm
        private const int keysize = 256;

        //Encrypt
        private static string EncryptToken(string plainText)
        {
            byte[] initVectorBytes = Encoding.UTF8.GetBytes(initVector);
            byte[] plainTextBytes = Encoding.UTF8.GetBytes(plainText);
            PasswordDeriveBytes password = new PasswordDeriveBytes(passPhrase, null);
            byte[] keyBytes = password.GetBytes(keysize / 8);
            RijndaelManaged symmetricKey = new RijndaelManaged();
            symmetricKey.Mode = CipherMode.CBC;
            ICryptoTransform encryptor = symmetricKey.CreateEncryptor(keyBytes, initVectorBytes);
            MemoryStream memoryStream = new MemoryStream();
            CryptoStream cryptoStream = new CryptoStream(memoryStream, encryptor, CryptoStreamMode.Write);
            cryptoStream.Write(plainTextBytes, 0, plainTextBytes.Length);
            cryptoStream.FlushFinalBlock();
            byte[] cipherTextBytes = memoryStream.ToArray();
            memoryStream.Close();
            cryptoStream.Close();
            return Convert.ToBase64String(cipherTextBytes);
        }
        public static string EncryptAccessToken(AccessTokenDto token)
        {
            string plainText = JsonConvert.SerializeObject(token);
            return EncryptToken(plainText);
        }
        public static string EncryptRefreshToken(RefreshTokenDto token)
        {
            string plainText = JsonConvert.SerializeObject(token);
            return EncryptToken(plainText);
        }

        //Decrypt
        private static string DecryptToken(string cipherText)
        {
            byte[] initVectorBytes = Encoding.UTF8.GetBytes(initVector);
            byte[] cipherTextBytes = Convert.FromBase64String(cipherText);
            PasswordDeriveBytes password = new PasswordDeriveBytes(passPhrase, null);
            byte[] keyBytes = password.GetBytes(keysize / 8);
            RijndaelManaged symmetricKey = new RijndaelManaged();
            symmetricKey.Mode = CipherMode.CBC;
            ICryptoTransform decryptor = symmetricKey.CreateDecryptor(keyBytes, initVectorBytes);
            MemoryStream memoryStream = new MemoryStream(cipherTextBytes);
            CryptoStream cryptoStream = new CryptoStream(memoryStream, decryptor, CryptoStreamMode.Read);
            byte[] plainTextBytes = new byte[cipherTextBytes.Length];
            int decryptedByteCount = cryptoStream.Read(plainTextBytes, 0, plainTextBytes.Length);
            memoryStream.Close();
            cryptoStream.Close();
            var resultString = Encoding.UTF8.GetString(plainTextBytes, 0, decryptedByteCount);
            return resultString;
        }
        public static AccessTokenDto DecryptAccessToken(string cipherText)
        {
            var resultString = DecryptToken(cipherText);
            return JsonConvert.DeserializeObject<AccessTokenDto>(resultString);
        }
        public static RefreshTokenDto DecryptRefreshToken(string cipherText)
        {
            var resultString = DecryptToken(cipherText);
            return JsonConvert.DeserializeObject<RefreshTokenDto>(resultString);
        }
    }
}