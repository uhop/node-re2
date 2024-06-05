#include "./wrapped_re2.h"

#include "./str-val.h"

static NAN_METHOD(GetUtf8Length)
{
	auto t = info[0]->ToString(Nan::GetCurrentContext());
	if (t.IsEmpty())
	{
		return;
	}
	info.GetReturnValue().Set(static_cast<int>(Nan::DecodeBytes(t.ToLocalChecked(), Nan::UTF8)));
}

static NAN_METHOD(GetUtf16Length)
{
	if (node::Buffer::HasInstance(info[0]))
	{
		const auto *s = node::Buffer::Data(info[0]);
		info.GetReturnValue().Set(static_cast<int>(getUtf16Length(s, s + node::Buffer::Length(info[0]))));
		return;
	}
	info.GetReturnValue().Set(-1);
}

static void cleanup(void *p)
{
	v8::Isolate *isolate = static_cast<v8::Isolate *>(p);
	auto p_tpl = Nan::GetIsolateData<Nan::Persistent<v8::FunctionTemplate>>(isolate);
	delete p_tpl;
}

// NAN_MODULE_INIT(WrappedRE2::Init)
v8::Local<v8::Function> WrappedRE2::Init()
{
	Nan::EscapableHandleScope scope;

	// prepare constructor template

	auto tpl = Nan::New<v8::FunctionTemplate>(New);
	tpl->SetClassName(Nan::New("RE2").ToLocalChecked());
	auto instanceTemplate = tpl->InstanceTemplate();
	instanceTemplate->SetInternalFieldCount(1);

	// save the template
	auto isolate = v8::Isolate::GetCurrent();
	auto p_tpl = new Nan::Persistent<v8::FunctionTemplate>(tpl);
	Nan::SetIsolateData(isolate, p_tpl);
	node::AddEnvironmentCleanupHook(isolate, cleanup, isolate);

	// prototype

	Nan::SetPrototypeMethod(tpl, "toString", ToString);

	Nan::SetPrototypeMethod(tpl, "exec", Exec);
	Nan::SetPrototypeMethod(tpl, "test", Test);

	Nan::SetPrototypeMethod(tpl, "match", Match);
	Nan::SetPrototypeMethod(tpl, "replace", Replace);
	Nan::SetPrototypeMethod(tpl, "search", Search);
	Nan::SetPrototypeMethod(tpl, "split", Split);

	Nan::SetPrototypeTemplate(tpl, "source", Nan::New("(?:)").ToLocalChecked());
	Nan::SetPrototypeTemplate(tpl, "flags", Nan::New("").ToLocalChecked());

	Nan::SetAccessor(instanceTemplate, Nan::New("source").ToLocalChecked(), GetSource);
	Nan::SetAccessor(instanceTemplate, Nan::New("flags").ToLocalChecked(), GetFlags);
	Nan::SetAccessor(instanceTemplate, Nan::New("global").ToLocalChecked(), GetGlobal);
	Nan::SetAccessor(instanceTemplate, Nan::New("ignoreCase").ToLocalChecked(), GetIgnoreCase);
	Nan::SetAccessor(instanceTemplate, Nan::New("multiline").ToLocalChecked(), GetMultiline);
	Nan::SetAccessor(instanceTemplate, Nan::New("dotAll").ToLocalChecked(), GetDotAll);
	Nan::SetAccessor(instanceTemplate, Nan::New("unicode").ToLocalChecked(), GetUnicode);
	Nan::SetAccessor(instanceTemplate, Nan::New("sticky").ToLocalChecked(), GetSticky);
	Nan::SetAccessor(instanceTemplate, Nan::New("hasIndices").ToLocalChecked(), GetHasIndices);
	Nan::SetAccessor(instanceTemplate, Nan::New("lastIndex").ToLocalChecked(), GetLastIndex, SetLastIndex);
	Nan::SetAccessor(instanceTemplate, Nan::New("internalSource").ToLocalChecked(), GetInternalSource);
	Nan::SetAccessor(instanceTemplate, Nan::New("enabledCache").ToLocalChecked(), GetEnabledCache);
	Nan::SetAccessor(instanceTemplate, Nan::New("isCached").ToLocalChecked(), GetIsCached);

	auto ctr = Nan::GetFunction(tpl).ToLocalChecked();

	// properties

	Nan::Export(ctr, "getUtf8Length", GetUtf8Length);
	Nan::Export(ctr, "getUtf16Length", GetUtf16Length);
	Nan::SetAccessor(v8::Local<v8::Object>(ctr), Nan::New("unicodeWarningLevel").ToLocalChecked(), GetUnicodeWarningLevel, SetUnicodeWarningLevel);

	return scope.Escape(ctr);
}

NODE_MODULE_INIT()
{
	Nan::HandleScope scope;
	Nan::Set(module->ToObject(context).ToLocalChecked(), Nan::New("exports").ToLocalChecked(), WrappedRE2::Init());
}

WrappedRE2::~WrappedRE2()
{
	for (auto ptr : callbackRegistry)
	{
		*ptr = nullptr;
	}
	dropLastString();
}

// private methods

WrappedRE2::PtrWrappedRE2 *WrappedRE2::registerCallback()
{
	PtrWrappedRE2 *ptr = new PtrWrappedRE2(this);
	callbackRegistry.insert(ptr);
	return ptr;
}

void WrappedRE2::unregisterCallback(PtrWrappedRE2 *ptr)
{
	callbackRegistry.erase(ptr);
}

void WrappedRE2::dropLastString()
{
	lastString.Reset();
	if (lastStringValue)
	{
		delete lastStringValue;
		lastStringValue = nullptr;
	}
}

void WrappedRE2::weakLastStringCallback(const Nan::WeakCallbackInfo<PtrWrappedRE2> &data)
{
	PtrWrappedRE2 *re2 = data.GetParameter();
	if (*re2)
	{
		(*re2)->unregisterCallback(re2);
		(*re2)->dropLastString();
	}
	delete re2;
}

void WrappedRE2::prepareLastString(const v8::Local<v8::Value> &arg, bool ignoreLastIndex)
{
	size_t startFrom = ignoreLastIndex ? 0 : lastIndex;

	if (node::Buffer::HasInstance(arg))
	{
		dropLastString();
		lastStringValue = new StrValBuffer(arg, startFrom);
		return;
	}

	// String

	// check if the same string is already in the cache
	if (lastString == arg && lastStringValue)
	{
		if (!global && !sticky)
			return; // we are good
		lastStringValue->setIndex(startFrom);
		return;
	}

	dropLastString();

	lastString.Reset(arg);
	static_cast<v8::PersistentBase<v8::Value> &>(lastString).SetWeak();

	Nan::Persistent<v8::Value> dummy(arg);
	dummy.SetWeak(registerCallback(), weakLastStringCallback, Nan::WeakCallbackType::kParameter);

	lastStringValue = new StrValString(arg, startFrom);
};
