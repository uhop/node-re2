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

// private methods

void WrappedRE2::dropLastString()
{
	lastString.Reset();
	if (lastStringValue)
	{
		delete lastStringValue;
		lastStringValue = nullptr;
	}
}

inline size_t countBytes(const char *data, size_t from, size_t n)
{
	for (; n > 0; --n)
	{
		size_t s = getUtf8CharSize(data[from]);
		from += s;
		if (s == 4 && n >= 2)
			--n; // this utf8 character will take two utf16 characters
					 // the decrement above is protected to avoid an overflow of an unsigned integer
	}
	return from;
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
	static_cast<v8::PersistentBase<v8::Value>&>(lastString).SetWeak();
	lastStringValue = new StrValString(arg, startFrom);
};
