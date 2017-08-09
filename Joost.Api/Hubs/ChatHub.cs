﻿using System.Threading.Tasks;
using Joost.DbAccess.Interfaces;
using Microsoft.AspNet.SignalR;
using Joost.DbAccess.Entities;

namespace Joost.Api.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        IUnitOfWork _unitOfWork;

        public ChatHub(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task Connect(int userId)
        {
            var connectionId = Context.ConnectionId;
            using (var userRepository = _unitOfWork.Repository<User>())
            {
                var user = await userRepository.GetAsync(userId);
                if (user != null && string.IsNullOrEmpty(user.ConnectionId))
                {
                    user.ConnectionId = connectionId;
                    foreach (var group in user.Groups)
                    {
                        await Groups.Add(connectionId, group.Id.ToString());
                    }
                    Clients.Caller.onConnected(connectionId, userId);
                    Clients.AllExcept(connectionId).onNewUserConnected(connectionId, userId);
                    await _unitOfWork.SaveAsync();
                }
            }
        }
        public override Task OnDisconnected(bool stopCalled)
        {
            using (var userRepository = _unitOfWork.Repository<User>())
            {
                var connectionId = Context.ConnectionId;
                var user = userRepository.Find(u => u.ConnectionId == connectionId);
                if (user != null)
                {
                    user.ConnectionId = string.Empty;
                    Clients.All.onUserDisconnected(connectionId, user.Id);
                    foreach (var group in user.Groups)
                    {
                        Groups.Remove(connectionId, group.Id.ToString());
                    }
                }
                _unitOfWork.Save();
            }
            return base.OnDisconnected(stopCalled);
        }
        public async Task SendToUser(int senderId, int receiverId, string message)
        {
            using (var userRepository = _unitOfWork.Repository<User>())
            {
                var receiver = await userRepository.GetAsync(receiverId);
                if (receiver != null && !string.IsNullOrEmpty(receiver.ConnectionId))
                {
                    Clients.Client(receiver.ConnectionId).addMessage(senderId, message);
                }
            }
        }
        public void SendToGroup(int senderId, int groupId, string message)
        {
            Clients.OthersInGroup(groupId.ToString()).addMessage(senderId, message);
        }
    }
}