import SwiftUI

struct MessagesView: View {
    @EnvironmentObject var model: AppModel
    @State private var draft = ""
    @FocusState private var focused: Bool

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        if model.messages.isEmpty {
                            VStack(spacing: 8) {
                                Text("Questions go straight to the desk.").font(.system(size: 17, weight: .semibold))
                                Text("Replies land here and as a notification. During shop hours you usually hear back within minutes.").font(.system(size: 13.5)).foregroundStyle(Theme.dim).multilineTextAlignment(.center)
                            }.padding(.top, 80).padding(.horizontal, 30)
                        }
                        ForEach(model.messages) { m in
                            let mine = m.sender == "customer"
                            HStack {
                                if mine { Spacer(minLength: 60) }
                                VStack(alignment: mine ? .trailing : .leading, spacing: 4) {
                                    Text(m.text ?? "").font(.system(size: 15.5)).padding(.horizontal, 14).padding(.vertical, 10)
                                        .background(mine ? Color.white : Theme.card, in: RoundedRectangle(cornerRadius: 18, style: .continuous)).foregroundStyle(mine ? .black : .white)
                                    Text((mine ? "You" : (model.shop?.name.split(separator: " ").first.map(String.init) ?? "Shop")) + " · " + (m.created_at?.clock ?? "")).font(.system(size: 11)).foregroundStyle(Theme.dimmer)
                                }
                                if !mine { Spacer(minLength: 60) }
                            }.id(m.id)
                        }
                    }.padding(16)
                }
                .onChange(of: model.messages.count) { _, _ in if let l = model.messages.last { withAnimation { proxy.scrollTo(l.id, anchor: .bottom) } } }
                .onAppear { if let l = model.messages.last { proxy.scrollTo(l.id, anchor: .bottom) } }
            }
            HStack(spacing: 10) {
                TextField("Message the shop", text: $draft, axis: .vertical).lineLimit(1...4).focused($focused).padding(.horizontal, 14).padding(.vertical, 12)
                    .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                Button { let t = draft; draft = ""; Task { await model.send(t) } } label: {
                    Image(systemName: "arrow.up").font(.system(size: 16, weight: .bold)).frame(width: 40, height: 40).background(draft.trimmingCharacters(in: .whitespaces).isEmpty ? Theme.control : Color.white, in: Circle()).foregroundStyle(draft.trimmingCharacters(in: .whitespaces).isEmpty ? Theme.dim : .black)
                }.disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
            }.padding(.horizontal, 14).padding(.vertical, 10).background(Theme.bg)
        }
        .background(Theme.bg)
        .navigationTitle("Messages")
        .toolbarTitleDisplayMode(.inline)
        .task { await model.markMessagesRead() }
    }
}

struct RateView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.dismiss) private var dismiss
    var appointment: Appointment
    @State private var stars = 0
    @State private var tags: Set<String> = []
    @State private var note = ""
    static let tagOptions = ["On time", "Clear estimate", "Fair price", "Friendly", "Clean car", "Great communication"]
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    Text("How did we do?").font(.system(size: 28, weight: .semibold)).tracking(-0.6).padding(.top, 20)
                    HStack(spacing: 10) {
                        ForEach(1...5, id: \.self) { i in
                            Button { withAnimation(.spring(duration: 0.3)) { stars = i } } label: { Image(systemName: i <= stars ? "star.fill" : "star").font(.system(size: 34)).foregroundStyle(i <= stars ? Theme.yellow : Theme.dimmer) }
                        }
                    }
                    FlowChipsMulti(items: Self.tagOptions, selected: $tags).padding(.horizontal, 20)
                    TextField("Anything else for the crew?", text: $note, axis: .vertical).lineLimit(2...5).padding(14).background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 12, style: .continuous)).padding(.horizontal, 20)
                    PrimaryButton(title: "Send rating", enabled: stars > 0, busy: model.busy) { Task { if await model.rate(appointment, stars: stars, tags: Array(tags), note: note) { dismiss() } } }.padding(.horizontal, 20)
                    Text("Goes straight to the team at " + (model.shop?.name ?? "the shop") + ".").font(.system(size: 12.5)).foregroundStyle(Theme.dimmer)
                }
            }
            .background(Theme.bg)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Not now") { dismiss() } } }
        }
        .presentationDetents([.large])
    }
}

struct FlowChipsMulti: View {
    var items: [String]
    @Binding var selected: Set<String>
    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 8)], spacing: 8) {
            ForEach(items, id: \.self) { it in
                let on = selected.contains(it)
                Button { if on { selected.remove(it) } else { selected.insert(it) } } label: {
                    Text(it).font(.system(size: 14, weight: .medium)).frame(maxWidth: .infinity).frame(height: 42)
                        .background(on ? Color.white : Theme.card, in: RoundedRectangle(cornerRadius: 12, style: .continuous)).foregroundStyle(on ? .black : .white)
                }.buttonStyle(.plain)
            }
        }
    }
}
