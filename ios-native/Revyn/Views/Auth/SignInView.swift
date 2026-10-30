import SwiftUI

/// Sign in with the same account as the website: email + password, or a one-time code by email.
struct SignInView: View {
    @EnvironmentObject var model: AppModel
    enum Mode { case password, create, code }
    @State private var mode: Mode = .password
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var code = ""
    @State private var codeSent = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Spacer(minLength: 120)
                Image("Logo").resizable().scaledToFit().frame(height: 13)
                Text(mode == .create ? "Create your account." : "Welcome back.").font(.system(size: 34, weight: .semibold)).tracking(-1).padding(.top, 24)
                Text("Your car, your visits and your records, in one place.").font(.system(size: 15)).foregroundStyle(Theme.dim).padding(.top, 10)

                VStack(spacing: 10) {
                    if mode == .create { TextField("Your name", text: $name).textContentType(.name).field() }
                    TextField("Email", text: $email).textContentType(.emailAddress).keyboardType(.emailAddress).textInputAutocapitalization(.never).autocorrectionDisabled().field()
                    if mode == .code {
                        if codeSent { TextField("6-digit code", text: $code).keyboardType(.numberPad).textContentType(.oneTimeCode).field() }
                    } else {
                        SecureField(mode == .create ? "Choose a password" : "Password", text: $password).textContentType(mode == .create ? .newPassword : .password).field()
                    }
                }.padding(.top, 28)

                PrimaryButton(title: cta, enabled: valid, busy: model.busy) { Task { await go() } }.padding(.top, 14)

                HStack {
                    Button(mode == .code ? "Use a password" : "Email me a code") { mode = mode == .code ? .password : .code; codeSent = false }
                    Spacer()
                    if mode == .password { Button("Forgot password?") { Task { await model.resetPassword(email: email) } }.disabled(!email.contains("@")) }
                }.font(.system(size: 13.5)).foregroundStyle(Theme.dim).padding(.top, 18)

                Button(mode == .create ? "Have an account? Sign in" : "New here? Create an account") { mode = mode == .create ? .password : .create }
                    .font(.system(size: 13.5)).foregroundStyle(.white).frame(maxWidth: .infinity).padding(.top, 28)
                Spacer(minLength: 40)
            }
            .padding(.horizontal, 22)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Theme.bg)
    }

    private var valid: Bool {
        guard email.contains("@") else { return false }
        switch mode {
        case .password: return password.count >= 6
        case .create: return password.count >= 8 && !name.trimmingCharacters(in: .whitespaces).isEmpty
        case .code: return !codeSent || code.count == 6
        }
    }
    private var cta: String {
        switch mode { case .password: "Sign in"; case .create: "Create account"; case .code: codeSent ? "Continue" : "Send code" }
    }
    private func go() async {
        switch mode {
        case .password: await model.signIn(email: email, password: password)
        case .create: await model.signUp(email: email, password: password, name: name.trimmingCharacters(in: .whitespaces))
        case .code: if codeSent { await model.verifyCode(email: email, code: code) } else { codeSent = await model.sendCode(email: email) }
        }
    }
}

/// First open: the mobile number the shop has on file ties this account to its vehicles and visits.
struct PhoneView: View {
    @EnvironmentObject var model: AppModel
    @State private var digits = ""
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer()
            Image("Logo").resizable().scaledToFit().frame(height: 13)
            Text("Your mobile number.").font(.system(size: 34, weight: .semibold)).tracking(-1).padding(.top, 22)
            Text("The number the shop has on file. Your car, your visits and your records follow it.").font(.system(size: 15)).foregroundStyle(Theme.dim).padding(.top, 12)
            TextField("(435) 555-0100", text: Binding(get: { digits.phoneFormattedPartial }, set: { digits = String($0.digits.prefix(10)) }))
                .keyboardType(.phonePad).textContentType(.telephoneNumber).field().font(.system(size: 20)).padding(.top, 28)
            PrimaryButton(title: "Continue", enabled: digits.count == 10, busy: model.busy) { Task { await model.savePhone(digits) } }.padding(.top, 14)
            Button("Sign out") { Task { await model.signOut() } }.font(.system(size: 13.5)).foregroundStyle(Theme.dim).frame(maxWidth: .infinity).padding(.top, 22)
        }
        .padding(.horizontal, 22).padding(.bottom, 30)
        .background(Theme.bg)
    }
}

extension String {
    var phoneFormattedPartial: String {
        let d = digits
        if d.count <= 3 { return d }
        if d.count <= 6 { return "(\(d.prefix(3))) \(d.dropFirst(3))" }
        return "(\(d.prefix(3))) \(d.dropFirst(3).prefix(3))-\(d.dropFirst(6).prefix(4))"
    }
}
