// A harness for tests/test-multi-env.mjs. It runs JavaScript in a new Node.js
// environment in the current isolate, and then frees the environment, as an
// embedder such as Electron does. It needs Node.js 26.11 or later.

#include <node.h>

#include <string_view>

// run(source): runs the source as the main script of a new environment, and
// returns its result. Return a primitive value: an object keeps the context.
static void run(const v8::FunctionCallbackInfo<v8::Value> &info)
{
	v8::Isolate *isolate = info.GetIsolate();
	node::Environment *current = node::GetCurrentEnvironment(isolate->GetCurrentContext());
	auto flags = static_cast<node::EnvironmentFlags::Flags>(
		node::EnvironmentFlags::kOwnsProcessState | node::EnvironmentFlags::kNoCreateInspector);
	// An empty context: Node.js creates it from its startup snapshot.
	node::Environment *env = node::CreateEnvironment(
		node::GetEnvironmentIsolateData(current), v8::Local<v8::Context>(), {"node"}, {}, flags);
	if (!env)
	{
		isolate->ThrowError(v8::String::NewFromUtf8Literal(isolate, "CreateEnvironment() failed"));
		return;
	}
	v8::String::Utf8Value source(isolate, info[0]);
	{
		v8::Context::Scope contextScope(node::GetMainContext(env));
		v8::Local<v8::Value> result;
		if (node::LoadEnvironment(env, std::string_view(*source, source.length())).ToLocal(&result))
		{
			info.GetReturnValue().Set(result);
		}
		// Let V8 drop the caches that can keep this context alive.
		isolate->ContextDisposedNotification(v8::ContextDependants::kSomeDependants);
	}
	node::FreeEnvironment(env);
}

NODE_MODULE_INIT(/* exports, module, context */)
{
	NODE_SET_METHOD(exports, "run", run);
}
