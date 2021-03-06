import { Component, OnInit } from '@angular/core';
import { MDL } from "../mdl-base.component";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent extends MDL implements OnInit {

	isLoadComplete:boolean = true;
	constructor() {
		super();
	}

	ngOnInit() { }

	receiveLoadResult($event){
		this.isLoadComplete = $event;
	}
}
