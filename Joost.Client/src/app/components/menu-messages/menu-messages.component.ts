﻿import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
import { Subscription } from "rxjs/Rx";
import { ViewEncapsulation } from '@angular/core';
import { Dialog } from "../../models/dialog";
import { Message } from "../../models/message";
import { DialogService } from "../../services/dialog.service";
import { ChatHubService } from "../../services/chat-hub.service";
import { GroupService } from "../../services/group.service";
import { EventEmitterService } from "../../services/event-emitter.service";

@Component({
  selector: 'app-menu-messages',
  templateUrl: './menu-messages.component.html',
  styleUrls: ['./menu-messages.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MenuMessagesComponent implements OnInit, OnDestroy {

  private dialogs: Dialog[];
  private contacts: UserContact[] = [];
  private filteredDialogs: Dialog[];
  private searchString: string;

  private senderSubscription: Subscription;
  private receiverSubscription: Subscription;
  private addingGroupsSubscription: Subscription;
  private newGroupSubscription: Subscription;
  private newContactSubscription: Subscription;

  constructor(
    private router: Router,
    private dialogService: DialogService, 
    private chatHubService: ChatHubService, 
    private contactService: ContactService,
    private groupServive: GroupService,
    private eventEmitterService: EventEmitterService) {
      this.updateDialogs();
  }

  ngOnInit() {
      this.receiverSubscription = this.chatHubService.addMessageEvent.subscribe(message => {
          this.updateLastMessage(message);
      });
      this.senderSubscription = this.eventEmitterService.addMessageEvent.subscribe(message => {
        this.updateLastMessage(message);        
      });

      this.addingGroupsSubscription = this.groupServive.addGroupEvent.subscribe(group => {
        this.updateDialogs();
      });

      this.newGroupSubscription = this.chatHubService.onNewGroupCreatedEvent.subscribe((groupDialog: Dialog) => {
        this.dialogs.push(groupDialog);
      });

      this.newContactSubscription = this.chatHubService.onNewUserInContactsEvent.subscribe((userContact: UserContact) => {
          if (userContact.State == ContactState.New) {
              this.contacts.push(userContact);
          }
      });
  }

  ngOnDestroy() {
      this.senderSubscription.unsubscribe();
      this.receiverSubscription.unsubscribe();
      this.addingGroupsSubscription.unsubscribe();
      this.newContactSubscription.unsubscribe();
      this.newGroupSubscription.unsubscribe();
  }

  private updateDialogs() {
    this.dialogService.getDialogs().subscribe(d => {
      var sortArray = this.OrderByArray(d, "DateLastMessage").map(item => item);
      this.dialogs = sortArray;
      this.filteredDialogs = sortArray;
    },
    async err => {
      await this.dialogService.handleTokenErrorIfExist(err).then(ok => { 
        if (ok) {
          this.dialogService.getDialogs().subscribe(d => {
            this.dialogs = d;
            this.filteredDialogs = d;
          }); 
        }
      });
    });
    this.contactService.getAllContacts().subscribe(data => {
        for (let item of data) {
            if (item.State == ContactState.New) {
                this.contacts.push(item);
            }
        }
    });
  }
  
  private updateLastUserMessage(message: Message) {
    let filteredDialogs = this.dialogs.filter(d => (d.Id == message.SenderId || d.Id == message.ReceiverId) && !d.IsGroup);
    if (filteredDialogs.length > 0) {
        filteredDialogs[0].LastMessage = message.Text;
        filteredDialogs[0].DateLastMessage = message.CreatedAt;
        this.filteredDialogs = this.OrderByArray(this.filteredDialogs, "DateLastMessage").map(item => item);
    }
  }

  private updateLastGroupMessage(message: Message) {
    let filteredDialogs = this.dialogs.filter(d => d.Id == message.ReceiverId && d.IsGroup);
    if (filteredDialogs.length > 0) {
        filteredDialogs[0].LastMessage = message.Text;
        filteredDialogs[0].DateLastMessage = message.CreatedAt;
        this.filteredDialogs = this.OrderByArray(this.filteredDialogs, "DateLastMessage").map(item => item);
    }
  }

  private updateLastMessage(message: Message) {
    if (message.IsGroup) {
      this.updateLastGroupMessage(message);
    }
    else {
      this.updateLastUserMessage(message);
    }
  }

  private navigateToMessages(dialog: Dialog) {
    this.router.navigate(["/menu/messages", dialog.IsGroup ? "group": "user", dialog.Id]);
  }

  private search() {
    let lowerStr  = this.searchString.toLocaleLowerCase();
    this.filteredDialogs = this.dialogs.filter(d => d.Name.toLocaleLowerCase().includes(lowerStr));
  }

  private OrderByArray(values: any[], orderType: any) {
      return values.sort((a, b) => {
          if (a[orderType] < b[orderType]) {
              return 1;
          }

          if (a[orderType] > b[orderType]) {
              return -1;
          }
          return 0
      });
  }

  private goToConfirm(id: number) {
      if (this.isNewContact(id) || this.isDeclineContact(id)) {
          this.contactService.changeContactIdNotify(id);
          this.router.navigate(['menu/add-contact']);
      }
  }

  isNewContact(id: number): boolean {
      return this.contacts.filter(t => t.Id == id)[0].State === ContactState.New;
  }

  isDeclineContact(id: number): boolean {
      return this.contacts.filter(t => t.Id == id)[0].State === ContactState.Decline;
  }
}
